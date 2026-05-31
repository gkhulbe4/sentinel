//! Pure classification of Solana transactions into normalized `OnChainEvent`s.
//!
//! The ingestor extracts proto fields from a Yellowstone (Geyser) transaction
//! update into the proto-free [`TxFacts`] struct; this module turns those facts
//! into an event. Keeping it proto-free makes the (heuristic) classification
//! trivially unit-testable without a live gRPC stream.
//!
//! Classification is best-effort and meta-driven (it reads pre/post balances,
//! token-balance deltas, and log messages rather than parsing every DEX's
//! instruction layout):
//! - **NEW_TOKEN** — a mint-initialization log is present.
//! - **TOKEN_SWAP** — the fee payer's token balances change across ≥2 mints, or
//!   one token mint changes alongside a native-SOL leg.
//! - **SOL_TRANSFER** — net native lamports move to another account.
//! - **WALLET_ACTIVITY** — anything else touching a watched account.

use serde_json::json;

use crate::types::{EventType, OnChainEvent};

const LAMPORTS_PER_SOL: f64 = 1_000_000_000.0;
/// Ignore fee-only / dust native movement (0.001 SOL).
const DUST_LAMPORTS: i128 = 1_000_000;

/// A token-balance change for one `(owner, mint)`, as a signed UI amount.
#[derive(Debug, Clone)]
pub struct TokenDelta {
    pub owner: String,
    pub mint: String,
    pub delta: f64,
}

/// Proto-free facts extracted from a Geyser transaction update. `account_keys`,
/// `pre_balances`, and `post_balances` are index-aligned.
#[derive(Debug, Clone)]
pub struct TxFacts {
    pub signature: String,
    pub slot: u64,
    pub fee_payer: String,
    pub account_keys: Vec<String>,
    pub pre_balances: Vec<u64>,
    pub post_balances: Vec<u64>,
    pub token_deltas: Vec<TokenDelta>,
    pub log_messages: Vec<String>,
}

/// Classify a transaction into a normalized event. `sol_price_usd` attaches a
/// USD value to native-SOL amounts (`None` → `usd_value` stays null, so `min_usd`
/// rules simply won't match).
#[must_use]
pub fn classify(facts: &TxFacts, sol_price_usd: Option<f64>) -> OnChainEvent {
    let fee_payer_native_delta = native_delta_for(facts, &facts.fee_payer);
    let receiver = largest_external_gain(facts);
    let swap = fee_payer_token_summary(facts);
    let is_new_token = facts
        .log_messages
        .iter()
        .any(|l| l.contains("InitializeMint") || l.contains("initialize_mint"));

    let fee_payer_sol_leg = fee_payer_native_delta.unsigned_abs() as i128 >= DUST_LAMPORTS;

    let (event_type, counterparty, amount_sol, token_mint) = if is_new_token {
        (EventType::NewToken, None, None, swap.bought.or(swap.sold))
    } else if swap.touched && (swap.distinct_mints >= 2 || fee_payer_sol_leg) {
        let amount_sol =
            fee_payer_sol_leg.then(|| fee_payer_native_delta.unsigned_abs() as f64 / LAMPORTS_PER_SOL);
        (EventType::TokenSwap, None, amount_sol, swap.bought.or(swap.sold))
    } else if let Some((addr, lamports)) = receiver {
        (
            EventType::SolTransfer,
            Some(addr),
            Some(lamports as f64 / LAMPORTS_PER_SOL),
            None,
        )
    } else {
        (EventType::WalletActivity, None, None, None)
    };

    let usd_value = match event_type {
        EventType::TokenSwap | EventType::SolTransfer => amount_sol
            .zip(sol_price_usd)
            .map(|(sol, price)| ((sol * price) * 100.0).round() / 100.0),
        _ => None,
    };

    OnChainEvent {
        signature: facts.signature.clone(),
        slot: facts.slot,
        event_type,
        wallet: facts.fee_payer.clone(),
        counterparty,
        amount_sol,
        usd_value,
        token_mint,
        raw: json!({ "source": "yellowstone" }),
    }
}

/// Net lamport change for an account (post - pre), 0 if not present.
fn native_delta_for(facts: &TxFacts, account: &str) -> i128 {
    let n = facts
        .account_keys
        .len()
        .min(facts.pre_balances.len())
        .min(facts.post_balances.len());
    for i in 0..n {
        if facts.account_keys[i] == account {
            return facts.post_balances[i] as i128 - facts.pre_balances[i] as i128;
        }
    }
    0
}

/// The non-fee-payer account that gained the most lamports (the transfer
/// recipient), if the gain clears the dust threshold.
fn largest_external_gain(facts: &TxFacts) -> Option<(String, i128)> {
    let n = facts
        .account_keys
        .len()
        .min(facts.pre_balances.len())
        .min(facts.post_balances.len());
    let mut best: Option<(usize, i128)> = None;
    for i in 0..n {
        if facts.account_keys[i] == facts.fee_payer {
            continue;
        }
        let delta = facts.post_balances[i] as i128 - facts.pre_balances[i] as i128;
        if delta > 0 && best.is_none_or(|(_, g)| delta > g) {
            best = Some((i, delta));
        }
    }
    best.filter(|(_, g)| *g >= DUST_LAMPORTS)
        .map(|(i, g)| (facts.account_keys[i].clone(), g))
}

struct SwapSummary {
    touched: bool,
    distinct_mints: usize,
    bought: Option<String>,
    sold: Option<String>,
}

/// Summarize the fee payer's token-balance changes: which mint they gained most
/// of (bought), which they lost most of (sold), and how many distinct mints moved.
fn fee_payer_token_summary(facts: &TxFacts) -> SwapSummary {
    let mut mints = std::collections::BTreeSet::new();
    let mut bought: Option<(String, f64)> = None;
    let mut sold: Option<(String, f64)> = None;
    for td in &facts.token_deltas {
        if td.owner != facts.fee_payer || td.delta == 0.0 {
            continue;
        }
        mints.insert(td.mint.clone());
        if td.delta > 0.0 && bought.as_ref().is_none_or(|(_, d)| td.delta > *d) {
            bought = Some((td.mint.clone(), td.delta));
        }
        if td.delta < 0.0 && sold.as_ref().is_none_or(|(_, d)| td.delta < *d) {
            sold = Some((td.mint.clone(), td.delta));
        }
    }
    SwapSummary {
        touched: !mints.is_empty(),
        distinct_mints: mints.len(),
        bought: bought.map(|(m, _)| m),
        sold: sold.map(|(m, _)| m),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn facts() -> TxFacts {
        TxFacts {
            signature: "sig".into(),
            slot: 1,
            fee_payer: "PAYER".into(),
            account_keys: vec!["PAYER".into(), "RECIPIENT".into()],
            pre_balances: vec![10_000_000_000, 0],
            post_balances: vec![10_000_000_000, 0],
            token_deltas: vec![],
            log_messages: vec![],
        }
    }

    #[test]
    fn native_transfer_is_sol_transfer() {
        let mut f = facts();
        // payer sends 5 SOL (+ fee); recipient gains 5 SOL.
        f.post_balances = vec![4_995_000_000, 5_000_000_000];
        let e = classify(&f, Some(100.0));
        assert_eq!(e.event_type, EventType::SolTransfer);
        assert_eq!(e.counterparty.as_deref(), Some("RECIPIENT"));
        assert_eq!(e.amount_sol, Some(5.0));
        assert_eq!(e.usd_value, Some(500.0));
    }

    #[test]
    fn buy_token_with_sol_is_swap() {
        let mut f = facts();
        // payer spends 1.5 SOL and receives a token.
        f.post_balances = vec![8_500_000_000, 0];
        f.token_deltas = vec![TokenDelta {
            owner: "PAYER".into(),
            mint: "USDC".into(),
            delta: 200.0,
        }];
        let e = classify(&f, Some(80.0));
        assert_eq!(e.event_type, EventType::TokenSwap);
        assert_eq!(e.token_mint.as_deref(), Some("USDC"));
        assert_eq!(e.amount_sol, Some(1.5));
        assert_eq!(e.usd_value, Some(120.0));
    }

    #[test]
    fn token_for_token_is_swap() {
        let mut f = facts();
        f.token_deltas = vec![
            TokenDelta { owner: "PAYER".into(), mint: "BONK".into(), delta: -1000.0 },
            TokenDelta { owner: "PAYER".into(), mint: "USDC".into(), delta: 5.0 },
        ];
        let e = classify(&f, None);
        assert_eq!(e.event_type, EventType::TokenSwap);
        assert_eq!(e.token_mint.as_deref(), Some("USDC"));
        assert_eq!(e.usd_value, None);
    }

    #[test]
    fn mint_init_log_is_new_token() {
        let mut f = facts();
        f.log_messages = vec!["Program log: Instruction: InitializeMint2".into()];
        let e = classify(&f, Some(100.0));
        assert_eq!(e.event_type, EventType::NewToken);
        assert_eq!(e.usd_value, None);
    }

    #[test]
    fn nothing_notable_is_wallet_activity() {
        let e = classify(&facts(), Some(100.0));
        assert_eq!(e.event_type, EventType::WalletActivity);
    }
}
