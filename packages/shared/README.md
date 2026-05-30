# @sentinel/shared

Cross-cutting TypeScript shared by `apps/web` and `apps/api`:

- **Generated types** (`generated/`) — TS mirrors of the Rust `core` domain,
  emitted by `ts-rs` so frontend, Node, and Rust agree on one contract.
- **Zod schemas** — runtime validation of those shapes at API/WS boundaries.
- **Helpers & constants** — pure functions (`formatSol`, `shortenAddress`,
  `usdValue`) and shared constants (channel names, thresholds).

Consumed as TypeScript source (Turborepo JIT pattern); no build step.
Populated in Phase 1.
