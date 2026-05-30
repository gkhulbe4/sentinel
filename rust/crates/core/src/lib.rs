//! Shared Sentinel domain: types, the pure `match_rule` logic, decode helpers,
//! and constants (program IDs, Redis channel names). Exported to TypeScript via
//! `ts-rs` so Rust, the Node API, and the frontend share one contract.
//!
//! Populated in Phase 1.

/// Crate name marker used by the Phase 0 binary stubs.
/// Replaced by the real domain exports in Phase 1.
pub fn crate_name() -> &'static str {
    "sentinel-core"
}
