//! Best-effort cached SOL→USD price, so live events can carry a `usdValue` that
//! `minUsd` rules match on. On any failure we reuse the last good price (or None).

use std::sync::Mutex;
use std::time::{Duration, Instant};

const TTL: Duration = Duration::from_secs(60);

#[derive(Default)]
pub struct SolPrice {
    cache: Mutex<Option<(f64, Instant)>>,
}

impl SolPrice {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Current SOL price in USD, refreshed at most once per minute.
    pub async fn get(&self) -> Option<f64> {
        // Fast path: a fresh cached value (guard dropped before any await).
        {
            let guard = self.cache.lock().unwrap();
            if let Some((price, at)) = *guard {
                if at.elapsed() < TTL {
                    return Some(price);
                }
            }
        }

        match fetch().await {
            Some(price) => {
                *self.cache.lock().unwrap() = Some((price, Instant::now()));
                Some(price)
            }
            None => self.cache.lock().unwrap().map(|(price, _)| price),
        }
    }
}

async fn fetch() -> Option<f64> {
    let resp = reqwest::Client::new()
        .get("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd")
        .timeout(Duration::from_secs(4))
        .send()
        .await
        .ok()?;
    if !resp.status().is_success() {
        return None;
    }
    let v: serde_json::Value = resp.json().await.ok()?;
    v.get("solana")?.get("usd")?.as_f64()
}
