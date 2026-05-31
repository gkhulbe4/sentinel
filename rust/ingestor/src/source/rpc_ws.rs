//! Free WebSocket RPC source. Works with any standard Solana RPC that exposes a
//! WebSocket (Helius / QuickNode **free** tiers, or the public endpoint).
//!
//! It watches the wallet addresses from users' **active rules** (read from
//! Postgres) plus any `RPC_WATCH_ACCOUNTS` extras: it `logsSubscribe`s to each,
//! fetches every matching transaction with `getTransaction` (jsonParsed), reduces
//! it to proto-free [`TxFacts`], and classifies it via
//! `sentinel_core::decode::classify`. So a user adding a "watch wallet X" rule in
//! the UI makes the ingestor start watching X — no env config, no paid plan, no
//! public URL, no `protoc`. The watched set is re-read periodically; when it
//! changes the stream reconnects with the new subscriptions.

use std::collections::{BTreeSet, HashMap};
use std::time::Duration;

use anyhow::{anyhow, Context};
use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use tokio::sync::mpsc;
use tokio_tungstenite::tungstenite::Message;
use tracing::{debug, error, info};

use sentinel_core::decode::{classify, TokenDelta, TxFacts};
use sentinel_core::OnChainEvent;

use super::EventSource;
use crate::config::Config;
use crate::price::SolPrice;

const RECONNECT_DELAY: Duration = Duration::from_secs(5);
/// How often to re-read the watched-wallet set from the DB.
const REFRESH_INTERVAL: Duration = Duration::from_secs(20);

pub struct WebSocketRpcEventSource {
    ws_url: String,
    http_url: String,
    database_url: String,
    /// Extra addresses to always watch (e.g. programs), from `RPC_WATCH_ACCOUNTS`.
    extra_accounts: Vec<String>,
}

impl WebSocketRpcEventSource {
    pub fn from_config(config: &Config) -> anyhow::Result<Self> {
        let ws_url = config
            .rpc_ws_url
            .clone()
            .ok_or_else(|| anyhow!("RPC_WS_URL is required for EVENT_SOURCE=rpc"))?;
        let http_url = config
            .rpc_http_url
            .clone()
            .ok_or_else(|| anyhow!("RPC_HTTP_URL is required for EVENT_SOURCE=rpc"))?;
        let database_url = config
            .database_url
            .clone()
            .ok_or_else(|| anyhow!("DATABASE_URL is required for EVENT_SOURCE=rpc (to read watched wallets)"))?;
        let extra_accounts = config
            .rpc_watch_accounts
            .as_deref()
            .unwrap_or("")
            .split(',')
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .map(String::from)
            .collect();
        Ok(Self { ws_url, http_url, database_url, extra_accounts })
    }

    /// The set of addresses to watch: every wallet pinned by an active rule,
    /// unioned with the static `RPC_WATCH_ACCOUNTS` extras. Sorted for stable
    /// change-detection.
    async fn watched_accounts(&self, pool: &PgPool) -> anyhow::Result<Vec<String>> {
        let rows: Vec<String> = sqlx::query_scalar(
            r#"SELECT DISTINCT "walletAddr" FROM "WatchRule" WHERE "isActive" = true AND "walletAddr" IS NOT NULL"#,
        )
        .fetch_all(pool)
        .await?;
        let mut set: BTreeSet<String> = self.extra_accounts.iter().cloned().collect();
        set.extend(rows);
        Ok(set.into_iter().collect())
    }

    async fn stream_once(
        &self,
        pool: &PgPool,
        tx: &mpsc::Sender<OnChainEvent>,
        price: &SolPrice,
        http: &reqwest::Client,
    ) -> anyhow::Result<()> {
        let watched = self.watched_accounts(pool).await.context("read watched wallets")?;
        if watched.is_empty() {
            debug!("no watched wallets yet — add a rule with a wallet address; idling");
            tokio::time::sleep(Duration::from_secs(15)).await;
            return Ok(());
        }

        let (mut ws, _) = tokio_tungstenite::connect_async(&self.ws_url)
            .await
            .context("connect RPC websocket")?;
        for (i, account) in watched.iter().enumerate() {
            let req = json!({
                "jsonrpc": "2.0",
                "id": i + 1,
                "method": "logsSubscribe",
                "params": [{ "mentions": [account] }, { "commitment": "confirmed" }],
            });
            ws.send(Message::Text(req.to_string().into()))
                .await
                .context("send logsSubscribe")?;
        }
        info!(accounts = watched.len(), "subscribed to RPC logs for watched wallets");

        let mut refresh = tokio::time::interval(REFRESH_INTERVAL);
        refresh.tick().await; // consume the immediate first tick

        loop {
            tokio::select! {
                maybe = ws.next() => {
                    let Some(message) = maybe else { break };
                    match message.context("ws read")? {
                        Message::Text(text) => {
                            self.on_text(text.as_str(), tx, price, http).await;
                            if tx.is_closed() {
                                return Ok(()); // publisher gone
                            }
                        }
                        Message::Ping(payload) => {
                            let _ = ws.send(Message::Pong(payload)).await;
                        }
                        Message::Close(_) => break,
                        _ => {}
                    }
                }
                _ = refresh.tick() => {
                    if let Ok(now) = self.watched_accounts(pool).await {
                        if now != watched {
                            info!(from = watched.len(), to = now.len(), "watched wallets changed; reconnecting");
                            return Ok(());
                        }
                    }
                }
            }
        }
        Ok(())
    }

    /// Handle one WS text frame: parse a `logsNotification`, fetch + classify the
    /// transaction, and publish the event. No-op for acks / failed txns.
    async fn on_text(
        &self,
        text: &str,
        tx: &mpsc::Sender<OnChainEvent>,
        price: &SolPrice,
        http: &reqwest::Client,
    ) {
        let Ok(value) = serde_json::from_str::<Value>(text) else {
            return;
        };
        if value.get("method").and_then(Value::as_str) != Some("logsNotification") {
            return; // subscription ack / other control message
        }
        let result = &value["params"]["result"]["value"];
        if !result["err"].is_null() {
            return; // failed transaction
        }
        let Some(signature) = result["signature"].as_str() else {
            return;
        };
        match self.fetch_facts(http, signature).await {
            Ok(Some(facts)) => {
                let _ = tx.send(classify(&facts, price.get().await)).await;
            }
            Ok(None) => {}
            Err(err) => debug!(%err, signature, "getTransaction failed"),
        }
    }

    async fn fetch_facts(
        &self,
        http: &reqwest::Client,
        signature: &str,
    ) -> anyhow::Result<Option<TxFacts>> {
        let body = json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTransaction",
            "params": [signature, {
                "maxSupportedTransactionVersion": 0,
                "encoding": "jsonParsed",
                "commitment": "confirmed",
            }],
        });
        let resp = http
            .post(&self.http_url)
            .json(&body)
            .timeout(Duration::from_secs(10))
            .send()
            .await?;
        let value: Value = resp.json().await?;
        Ok(facts_from_get_transaction(&value["result"], signature.to_string()))
    }
}

#[async_trait::async_trait]
impl EventSource for WebSocketRpcEventSource {
    async fn run(self: Box<Self>, tx: mpsc::Sender<OnChainEvent>) -> anyhow::Result<()> {
        let pool = PgPoolOptions::new()
            .max_connections(2)
            .connect(&self.database_url)
            .await
            .context("connect Postgres (rpc watched wallets)")?;
        let price = SolPrice::new();
        let http = reqwest::Client::new();
        loop {
            match self.stream_once(&pool, &tx, &price, &http).await {
                Ok(()) => debug!("RPC stream cycle ended; reconnecting"),
                Err(err) => error!(%err, "RPC websocket error; reconnecting"),
            }
            if tx.is_closed() {
                return Ok(());
            }
            tokio::time::sleep(RECONNECT_DELAY).await;
        }
    }
}

/// Build [`TxFacts`] from a `getTransaction` result (jsonParsed encoding). Pure
/// and unit-tested. Returns `None` if the result is null/unparseable.
pub fn facts_from_get_transaction(result: &Value, signature: String) -> Option<TxFacts> {
    if result.is_null() {
        return None;
    }
    let slot = result["slot"].as_u64().unwrap_or(0);
    let message = &result["transaction"]["message"];

    // Static account keys (jsonParsed → objects with a `pubkey` field).
    let mut account_keys: Vec<String> = message["accountKeys"]
        .as_array()?
        .iter()
        .filter_map(|k| k.get("pubkey").and_then(Value::as_str).or_else(|| k.as_str()))
        .map(String::from)
        .collect();
    // Append address-lookup-table loaded addresses (writable then readonly) so
    // balance indices line up for versioned transactions.
    let meta = &result["meta"];
    for key in ["writable", "readonly"] {
        if let Some(arr) = meta["loadedAddresses"][key].as_array() {
            account_keys.extend(arr.iter().filter_map(|a| a.as_str().map(String::from)));
        }
    }

    let fee_payer = account_keys.first()?.clone();
    let pre_balances = as_u64_vec(&meta["preBalances"]);
    let post_balances = as_u64_vec(&meta["postBalances"]);
    let log_messages = meta["logMessages"]
        .as_array()
        .map(|a| a.iter().filter_map(|m| m.as_str().map(String::from)).collect())
        .unwrap_or_default();

    Some(TxFacts {
        signature,
        slot,
        fee_payer,
        account_keys,
        pre_balances,
        post_balances,
        token_deltas: token_deltas_from_meta(meta),
        log_messages,
    })
}

fn as_u64_vec(v: &Value) -> Vec<u64> {
    v.as_array()
        .map(|a| a.iter().filter_map(Value::as_u64).collect())
        .unwrap_or_default()
}

fn token_deltas_from_meta(meta: &Value) -> Vec<TokenDelta> {
    // account_index -> (owner, mint, ui_amount)
    let read = |key: &str| -> HashMap<u64, (String, String, f64)> {
        let mut m = HashMap::new();
        if let Some(arr) = meta[key].as_array() {
            for b in arr {
                let Some(idx) = b["accountIndex"].as_u64() else { continue };
                let owner = b["owner"].as_str().unwrap_or_default().to_string();
                let mint = b["mint"].as_str().unwrap_or_default().to_string();
                let amount = b["uiTokenAmount"]["uiAmount"].as_f64().unwrap_or(0.0);
                m.insert(idx, (owner, mint, amount));
            }
        }
        m
    };
    let pre = read("preTokenBalances");
    let post = read("postTokenBalances");

    let indices: BTreeSet<u64> = pre.keys().chain(post.keys()).copied().collect();
    let mut out = Vec::new();
    for idx in indices {
        let p = pre.get(&idx);
        let q = post.get(&idx);
        let (owner, mint) = q.or(p).map(|(o, m, _)| (o.clone(), m.clone())).unwrap_or_default();
        let delta = q.map_or(0.0, |(_, _, a)| *a) - p.map_or(0.0, |(_, _, a)| *a);
        if delta.abs() > f64::EPSILON && !owner.is_empty() {
            out.push(TokenDelta { owner, mint, delta });
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use sentinel_core::EventType;

    #[test]
    fn parses_native_transfer_from_get_transaction() {
        let result = json!({
            "slot": 250_000_000,
            "transaction": {
                "message": {
                    "accountKeys": [
                        { "pubkey": "PAYER", "signer": true, "writable": true },
                        { "pubkey": "RECIPIENT", "signer": false, "writable": true }
                    ]
                }
            },
            "meta": {
                "preBalances": [5_000_000_000u64, 0u64],
                "postBalances": [2_999_995_000u64, 2_000_000_000u64],
                "preTokenBalances": [],
                "postTokenBalances": [],
                "logMessages": ["Program 11111111111111111111111111111111 invoke [1]"]
            }
        });
        let facts = facts_from_get_transaction(&result, "sig123".into()).expect("facts");
        assert_eq!(facts.fee_payer, "PAYER");
        assert_eq!(facts.account_keys.len(), 2);
        let event = classify(&facts, Some(100.0));
        assert_eq!(event.event_type, EventType::SolTransfer);
        assert_eq!(event.counterparty.as_deref(), Some("RECIPIENT"));
        assert_eq!(event.amount_sol, Some(2.0));
        assert_eq!(event.usd_value, Some(200.0));
    }

    #[test]
    fn parses_token_deltas_for_swap() {
        let result = json!({
            "slot": 1,
            "transaction": { "message": { "accountKeys": [{ "pubkey": "PAYER" }] } },
            "meta": {
                "preBalances": [3_000_000_000u64],
                "postBalances": [1_500_000_000u64],
                "preTokenBalances": [],
                "postTokenBalances": [
                    { "accountIndex": 5, "owner": "PAYER", "mint": "USDC", "uiTokenAmount": { "uiAmount": 200.0 } }
                ],
                "logMessages": []
            }
        });
        let facts = facts_from_get_transaction(&result, "sig".into()).expect("facts");
        assert_eq!(facts.token_deltas.len(), 1);
        let event = classify(&facts, Some(80.0));
        assert_eq!(event.event_type, EventType::TokenSwap);
        assert_eq!(event.token_mint.as_deref(), Some("USDC"));
    }

    #[test]
    fn null_result_is_none() {
        assert!(facts_from_get_transaction(&Value::Null, "s".into()).is_none());
    }
}
