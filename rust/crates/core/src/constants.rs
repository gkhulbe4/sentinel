//! On-chain program IDs and Redis channel names — the single source of truth,
//! mirrored in `packages/shared/constants`.

/// Channel the ingestor publishes normalized events to.
pub const CHANNEL_EVENTS: &str = "events";

/// Prefix for per-user enriched-alert channels (`alerts:{userId}`).
pub const CHANNEL_ALERTS_PREFIX: &str = "alerts:";

/// Prefix for per-user "rules changed" cache-invalidation messages.
pub const CHANNEL_RULES_CHANGED_PREFIX: &str = "rules:changed:";

/// Per-user alert channel name.
#[must_use]
pub fn channel_alerts(user_id: &str) -> String {
    format!("{CHANNEL_ALERTS_PREFIX}{user_id}")
}

/// Per-user rules-changed channel name.
#[must_use]
pub fn channel_rules_changed(user_id: &str) -> String {
    format!("{CHANNEL_RULES_CHANGED_PREFIX}{user_id}")
}

// --- Solana mainnet program IDs (used by the Yellowstone decoders, Phase 5) ---

/// Raydium AMM v4 (liquidity pools / swaps).
pub const RAYDIUM_AMM_V4: &str = "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8";
/// Jupiter Aggregator v6 (swap routing).
pub const JUPITER_V6: &str = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";
/// pump.fun (token launches / bonding-curve swaps).
pub const PUMP_FUN: &str = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
/// SPL Token program (mints, transfers).
pub const SPL_TOKEN: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
/// SPL Token-2022 program.
pub const SPL_TOKEN_2022: &str = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
