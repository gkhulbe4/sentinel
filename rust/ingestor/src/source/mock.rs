use std::time::Duration;

use rand::rngs::ThreadRng;
use rand::Rng;
use serde_json::json;
use tokio::sync::mpsc;
use tokio::time::{interval, MissedTickBehavior};
use tracing::{info, warn};

use sentinel_core::{EventType, OnChainEvent};

use super::EventSource;

/// Assumed SOL→USD price for mock USD values (the real source fetches this).
const SOL_USD: f64 = 150.0;

const BASE58: &[u8] = b"123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/// A small pool of plausible wallet addresses so wallet-scoped rules can match.
const WALLETS: &[&str] = &[
    "7Np41oeYqPefeNQEHSv1UDhYrehxin3NStELsSKCT4K2",
    "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9",
    "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
    "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH",
    "GThUX1Atko4tqhN2NaiTazWSeFWMuiUvfFnyJyUghFMJ",
];

/// (mint, symbol) pairs — real mainnet mints for flavor.
const MINTS: &[(&str, &str)] = &[
    ("So11111111111111111111111111111111111111112", "SOL"),
    ("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "USDC"),
    ("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", "BONK"),
    ("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", "USDT"),
];

const DEXES: &[&str] = &["Raydium", "Jupiter", "pump.fun", "Orca"];

pub struct MockEventSource {
    rate: f64,
}

impl MockEventSource {
    pub fn new(rate: f64) -> Self {
        Self { rate: rate.max(0.1) }
    }
}

#[async_trait::async_trait]
impl EventSource for MockEventSource {
    async fn run(self: Box<Self>, tx: mpsc::Sender<OnChainEvent>) -> anyhow::Result<()> {
        let period = Duration::from_secs_f64(1.0 / self.rate);
        let mut ticker = interval(period);
        ticker.set_missed_tick_behavior(MissedTickBehavior::Skip);
        let mut slot: u64 = 330_000_000;
        let mut dropped: u64 = 0;
        info!(rate = self.rate, "mock event source started");

        loop {
            ticker.tick().await;
            slot += 1;
            let event = generate_event(slot);
            // Bounded channel = backpressure: drop (and count) rather than block.
            if tx.try_send(event).is_err() {
                dropped += 1;
                if dropped.is_multiple_of(100) {
                    warn!(dropped, "backpressure: dropping mock events");
                }
            }
        }
    }
}

fn pick<'a, T>(rng: &mut ThreadRng, items: &'a [T]) -> &'a T {
    &items[rng.gen_range(0..items.len())]
}

fn rand_b58(rng: &mut ThreadRng, len: usize) -> String {
    (0..len)
        .map(|_| BASE58[rng.gen_range(0..BASE58.len())] as char)
        .collect()
}

fn generate_event(slot: u64) -> OnChainEvent {
    let mut rng = rand::thread_rng();
    let event_type = *pick(
        &mut rng,
        &[
            EventType::SolTransfer,
            EventType::TokenSwap,
            EventType::NewToken,
            EventType::WalletActivity,
        ],
    );
    let signature = rand_b58(&mut rng, 88);
    let wallet = (*pick(&mut rng, WALLETS)).to_string();

    match event_type {
        EventType::SolTransfer => {
            let amount_sol = rng.gen_range(0.05..6000.0);
            let counterparty = (*pick(&mut rng, WALLETS)).to_string();
            OnChainEvent {
                signature,
                slot,
                event_type,
                wallet,
                counterparty: Some(counterparty),
                amount_sol: Some(amount_sol),
                usd_value: Some(amount_sol * SOL_USD),
                token_mint: None,
                raw: json!({ "kind": "systemTransfer", "lamports": (amount_sol * 1e9) as u64 }),
            }
        }
        EventType::TokenSwap => {
            let (mint, symbol) = *pick(&mut rng, MINTS);
            let usd = rng.gen_range(20.0..300_000.0);
            let dex = *pick(&mut rng, DEXES);
            OnChainEvent {
                signature,
                slot,
                event_type,
                wallet,
                counterparty: None,
                amount_sol: Some(usd / SOL_USD),
                usd_value: Some(usd),
                token_mint: Some(mint.to_string()),
                raw: json!({ "dex": dex, "symbol": symbol, "side": if rng.gen_bool(0.5) { "buy" } else { "sell" } }),
            }
        }
        EventType::NewToken => {
            let mint = rand_b58(&mut rng, 44);
            let age_seconds = rng.gen_range(1..180);
            OnChainEvent {
                signature,
                slot,
                event_type,
                wallet,
                counterparty: None,
                amount_sol: None,
                usd_value: None,
                token_mint: Some(mint),
                raw: json!({ "program": "pump.fun", "ageSeconds": age_seconds, "initialLiquiditySol": rng.gen_range(1.0..50.0) }),
            }
        }
        EventType::WalletActivity => {
            let amount_sol = rng.gen_range(0.001..25.0);
            OnChainEvent {
                signature,
                slot,
                event_type,
                wallet,
                counterparty: Some((*pick(&mut rng, WALLETS)).to_string()),
                amount_sol: Some(amount_sol),
                usd_value: Some(amount_sol * SOL_USD),
                token_mint: None,
                raw: json!({ "kind": "interaction" }),
            }
        }
    }
}
