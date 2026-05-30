# rust/

Cargo workspace for Sentinel's performance-critical, Solana-native services.
Separate from the pnpm/Turbo JS workspace; driven from the repo root via
`pnpm rust:check | rust:clippy | rust:test | rust:build | rust:fmt`.

## Members

- **`crates/core`** (`sentinel-core`) — shared domain types, `match_rule`,
  decoders, constants. Exported to TS via `ts-rs`.
- **`ingestor`** (`sentinel-ingestor`) — Solana stream → normalized events →
  Redis `events`.
- **`matcher`** (`sentinel-matcher`) — events → rule match → persist + enrich →
  Redis `alerts:{userId}`.

## Toolchain

Pinned to **stable** via `../rust-toolchain.toml` (edition 2021). The first
`cargo` command fetches the toolchain.

## Commands

```bash
cargo check  --manifest-path rust/Cargo.toml --all-targets
cargo clippy --manifest-path rust/Cargo.toml --all-targets -- -D warnings
cargo test   --manifest-path rust/Cargo.toml
cargo run -p sentinel-ingestor
cargo run -p sentinel-matcher
```
