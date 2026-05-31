//! Helius Yellowstone gRPC (Geyser) source — a market-wide firehose of confirmed
//! transactions. Each update is reduced to proto-free [`TxFacts`] and classified
//! by `sentinel_core::decode::classify` into an `OnChainEvent`, then pushed onto
//! the channel the publisher drains to Redis. Reconnects with a fixed backoff.

use std::collections::HashMap;
use std::time::Duration;

use anyhow::Context;
use futures_util::{SinkExt, StreamExt};
use tokio::sync::mpsc;
use tracing::{error, info, warn};

use sentinel_core::decode::{classify, TokenDelta, TxFacts};
use sentinel_core::OnChainEvent;
use yellowstone_grpc_client::{ClientTlsConfig, GeyserGrpcClient};
use yellowstone_grpc_proto::geyser::subscribe_update::UpdateOneof;
use yellowstone_grpc_proto::prelude::{
    CommitmentLevel, SubscribeRequest, SubscribeRequestFilterTransactions,
    SubscribeUpdateTransactionInfo, TokenBalance, TransactionStatusMeta,
};

use super::EventSource;
use crate::config::Config;
use crate::price::SolPrice;

const RECONNECT_DELAY: Duration = Duration::from_secs(5);
const MAX_MESSAGE_SIZE: usize = 64 * 1024 * 1024;

pub struct YellowstoneEventSource {
    endpoint: String,
    x_token: Option<String>,
}

impl YellowstoneEventSource {
    pub fn from_config(config: &Config) -> anyhow::Result<Self> {
        let endpoint = config
            .helius_grpc_url
            .clone()
            .ok_or_else(|| anyhow::anyhow!("HELIUS_GRPC_URL is required for EVENT_SOURCE=yellowstone"))?;
        Ok(Self {
            endpoint,
            x_token: config.helius_api_key.clone(),
        })
    }

    async fn stream_once(
        &self,
        tx: &mpsc::Sender<OnChainEvent>,
        price: &SolPrice,
    ) -> anyhow::Result<()> {
        let mut client = GeyserGrpcClient::build_from_shared(self.endpoint.clone())?
            .x_token(self.x_token.clone())?
            .tls_config(ClientTlsConfig::new().with_native_roots())?
            .max_decoding_message_size(MAX_MESSAGE_SIZE)
            .connect()
            .await
            .context("connect to Yellowstone gRPC")?;

        let (mut subscribe_tx, mut stream) = client.subscribe().await.context("open subscribe stream")?;
        subscribe_tx
            .send(subscribe_request())
            .await
            .context("send subscribe request")?;
        info!(endpoint = %self.endpoint, "subscribed to Yellowstone transactions");

        while let Some(message) = stream.next().await {
            let update = message.context("stream message")?;
            let Some(UpdateOneof::Transaction(tx_update)) = update.update_oneof else {
                continue;
            };
            let slot = tx_update.slot;
            let Some(info) = tx_update.transaction else { continue };
            if info.is_vote {
                continue;
            }
            if let Some(facts) = extract_facts(info, slot) {
                let event = classify(&facts, price.get().await);
                if tx.send(event).await.is_err() {
                    return Ok(()); // publisher gone — shut down
                }
            }
        }
        Ok(())
    }
}

#[async_trait::async_trait]
impl EventSource for YellowstoneEventSource {
    async fn run(self: Box<Self>, tx: mpsc::Sender<OnChainEvent>) -> anyhow::Result<()> {
        let price = SolPrice::new();
        loop {
            match self.stream_once(&tx, &price).await {
                Ok(()) => {
                    warn!("Yellowstone stream ended; reconnecting");
                }
                Err(err) => {
                    error!(%err, "Yellowstone stream error; reconnecting");
                }
            }
            if tx.is_closed() {
                return Ok(());
            }
            tokio::time::sleep(RECONNECT_DELAY).await;
        }
    }
}

/// Subscribe to all confirmed, non-vote, non-failed transactions (market-wide).
/// Narrow this with `account_include` to watch specific programs/wallets.
fn subscribe_request() -> SubscribeRequest {
    let mut transactions = HashMap::new();
    transactions.insert(
        "sentinel".to_string(),
        SubscribeRequestFilterTransactions {
            vote: Some(false),
            failed: Some(false),
            ..Default::default()
        },
    );
    SubscribeRequest {
        transactions,
        commitment: Some(CommitmentLevel::Confirmed as i32),
        ..Default::default()
    }
}

/// Reduce a Geyser transaction update to proto-free facts for classification.
fn extract_facts(info: SubscribeUpdateTransactionInfo, slot: u64) -> Option<TxFacts> {
    let signature = bs58::encode(&info.signature).into_string();
    let message = info.transaction?.message?;
    let account_keys: Vec<String> = message
        .account_keys
        .iter()
        .map(|k| bs58::encode(k).into_string())
        .collect();
    let fee_payer = account_keys.first()?.clone();
    let meta = info.meta?;

    Some(TxFacts {
        signature,
        slot,
        fee_payer,
        account_keys,
        pre_balances: meta.pre_balances.clone(),
        post_balances: meta.post_balances.clone(),
        token_deltas: token_deltas(&meta),
        log_messages: meta.log_messages.clone(),
    })
}

/// Per-(owner, mint) token-balance change, derived from pre/post token balances.
fn token_deltas(meta: &TransactionStatusMeta) -> Vec<TokenDelta> {
    let ui = |b: &TokenBalance| b.ui_token_amount.as_ref().map_or(0.0, |a| a.ui_amount);
    // account_index -> (owner, mint, pre, post)
    let mut by_index: HashMap<u32, (String, String, f64, f64)> = HashMap::new();
    for b in &meta.pre_token_balances {
        let e = by_index
            .entry(b.account_index)
            .or_insert_with(|| (b.owner.clone(), b.mint.clone(), 0.0, 0.0));
        e.0 = b.owner.clone();
        e.1 = b.mint.clone();
        e.2 = ui(b);
    }
    for b in &meta.post_token_balances {
        let e = by_index
            .entry(b.account_index)
            .or_insert_with(|| (b.owner.clone(), b.mint.clone(), 0.0, 0.0));
        e.0 = b.owner.clone();
        e.1 = b.mint.clone();
        e.3 = ui(b);
    }
    by_index
        .into_values()
        .filter(|(_, _, pre, post)| (post - pre).abs() > f64::EPSILON)
        .map(|(owner, mint, pre, post)| TokenDelta {
            owner,
            mint,
            delta: post - pre,
        })
        .collect()
}
