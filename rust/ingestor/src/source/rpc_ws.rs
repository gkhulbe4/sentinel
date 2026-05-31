//! Free WebSocket RPC source. Works with any standard Solana RPC that exposes a
//! WebSocket (Helius / QuickNode **free** tiers, or the public endpoint): it
//! `logsSubscribe`s to the watched accounts, fetches each matching transaction
//! with `getTransaction` (jsonParsed), reduces it to proto-free [`TxFacts`], and
//! classifies it via `sentinel_core::decode::classify`. No paid plan, no public
//! URL, no protoc — just an RPC key. Reconnects with a fixed backoff.

use std::collections::{BTreeSet, HashMap};
use std::time::Duration;

use anyhow::{anyhow, Context};
use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use tokio::sync::mpsc;
use tokio_tungstenite::tungstenite::Message;
use tracing::{debug, info, warn};

use sentinel_core::decode::{classify, TokenDelta, TxFacts};
use sentinel_core::OnChainEvent;

use super::EventSource;
use crate::config::Config;
use crate::price::SolPrice;

const RECONNECT_DELAY: Duration = Duration::from_secs(5);

pub struct WebSocketRpcEventSource {
    ws_url: String,
    http_url: String,
    accounts: Vec<String>,
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
        let accounts: Vec<String> = config
            .rpc_watch_accounts
            .as_deref()
            .unwrap_or("")
            .split(',')
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .map(String::from)
            .collect();
        if accounts.is_empty() {
            warn!("RPC_WATCH_ACCOUNTS is empty — set comma-separated wallet/program addresses to watch");
        }
        Ok(Self { ws_url, http_url, accounts })
    }

    async fn stream_once(
        &self,
        tx: &mpsc::Sender<OnChainEvent>,
        price: &SolPrice,
        http: &reqwest::Client,
    ) -> anyhow::Result<()> {
        let (mut ws, _) = tokio_tungstenite::connect_async(&self.ws_url)
            .await
            .context("connect RPC websocket")?;

        for (i, account) in self.accounts.iter().enumerate() {
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
        info!(accounts = self.accounts.len(), "subscribed to RPC logs");

        while let Some(message) = ws.next().await {
            match message.context("ws read")? {
                Message::Text(text) => {
                    let Ok(value) = serde_json::from_str::<Value>(text.as_str()) else {
                        continue;
                    };
                    if value.get("method").and_then(Value::as_str) != Some("logsNotification") {
                        continue; // subscription ack or other control message
                    }
                    let result = &value["params"]["result"]["value"];
                    if !result["err"].is_null() {
                        continue; // failed transaction
                    }
                    let Some(signature) = result["signature"].as_str() else {
                        continue;
                    };
                    match self.fetch_facts(http, signature).await {
                        Ok(Some(facts)) => {
                            let event = classify(&facts, price.get().await);
                            if tx.send(event).await.is_err() {
                                return Ok(()); // publisher gone
                            }
                        }
                        Ok(None) => {}
                        Err(err) => debug!(%err, signature, "getTransaction failed"),
                    }
                }
                Message::Ping(payload) => {
                    let _ = ws.send(Message::Pong(payload)).await;
                }
                Message::Close(_) => break,
                _ => {}
            }
        }
        Ok(())
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
        let price = SolPrice::new();
        let http = reqwest::Client::new();
        loop {
            match self.stream_once(&tx, &price, &http).await {
                Ok(()) => warn!("RPC websocket ended; reconnecting"),
                Err(err) => tracing::error!(%err, "RPC websocket error; reconnecting"),
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
        // Minimal jsonParsed getTransaction result for a 2-SOL transfer.
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
