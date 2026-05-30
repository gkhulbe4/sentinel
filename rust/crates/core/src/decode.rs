//! Solana transaction decoders: turn raw Yellowstone updates into normalized
//! `OnChainEvent`s. Stubs for now — real decoding lands in Phase 5, kept here so
//! the logic is isolated, named, and unit-testable.

use crate::types::OnChainEvent;

/// Decode a native SOL transfer. Returns `None` if the update isn't one.
#[must_use]
pub fn decode_transfer(_raw: &serde_json::Value) -> Option<OnChainEvent> {
    None
}

/// Decode a DEX swap (Raydium / Jupiter / pump.fun).
#[must_use]
pub fn decode_swap(_raw: &serde_json::Value) -> Option<OnChainEvent> {
    None
}

/// Decode a new mint / pool creation.
#[must_use]
pub fn decode_new_token(_raw: &serde_json::Value) -> Option<OnChainEvent> {
    None
}
