# sentinel-core

Shared Rust library for the Sentinel services. Holds:

- domain types (`OnChainEvent`, `WatchRule`, `EventType`, `Alert`) with
  `serde` + `ts-rs` derives,
- the pure, unit-tested `match_rule(event, rule) -> bool`,
- Solana decode helpers (`decode_transfer`, `decode_swap`, …),
- constants (program IDs, Redis channel names, thresholds).

The package is named `sentinel-core` (not `core`) to avoid shadowing Rust's
standard `core` crate. Domain lands in Phase 1.
