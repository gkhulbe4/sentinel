//! Shared Sentinel domain: types, the pure `match_rule` logic, decode helpers,
//! and constants (program IDs, Redis channel names). Exported to TypeScript via
//! `ts-rs` so Rust, the Node API, and the frontend share one contract.

pub mod constants;
pub mod decode;
pub mod matching;
pub mod types;

pub use matching::match_rule;
pub use types::{
    Alert, AlertEnrichedPatch, Enrichment, EventType, OnChainEvent, RiskFlag, ServerMessage,
    WatchRule,
};

/// Crate name marker used by the Phase 0 binary stubs (rewritten in Phase 5/6).
#[must_use]
pub fn crate_name() -> &'static str {
    "sentinel-core"
}
