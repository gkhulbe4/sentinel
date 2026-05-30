# Sentinel

A production-quality, real-time **Solana watchtower**. Create watch rules, and
the instant matching on-chain activity happens, a live, AI-enriched alert is
pushed to your dashboard.

Polyglot by design: **Rust** on the hot path, **Node** for the API, **Next.js**
for the web app — decoupled through **Redis** pub/sub.

> Full docs (architecture diagram, env table, deploy) land in Phase 13. This is
> the Phase 0 scaffold.

## Architecture (at a glance)

```
Helius Yellowstone gRPC
        │
        ▼
[rust/ingestor] decode → normalize → Redis "events"
        ▼
[rust/matcher]  match_rule → persist Alert (sqlx) → enrich (OpenAI)
        │                                  → Redis "alerts:{userId}"
        ▼
[apps/api]      WebSocket fan-out (per-user Redis subscription)
        ▼
[apps/web]      live dashboard prepends the alert
```

Rust and Node never call each other — Redis is the seam. Postgres (Prisma-owned
schema) is the store; Rust reads/writes it via `sqlx`. Rust `core` types are
exported to TypeScript via `ts-rs` for one shared contract.

## Layout

| Path             | What                                                  |
| ---------------- | ----------------------------------------------------- |
| `apps/web`       | Next.js (App Router) frontend                         |
| `apps/api`       | Fastify + `ws` Node service                           |
| `rust/`          | Cargo workspace: `core`, `ingestor`, `matcher`        |
| `packages/db`    | Prisma schema + migrations (schema authority)         |
| `packages/shared`| Zod + ts-rs-generated TS types + JS helpers           |
| `packages/config`| Shared ESLint / Prettier / tsconfig                   |

## Prerequisites

Node ≥ 24, pnpm 10, Rust (stable — auto-pinned via `rust-toolchain.toml`),
Docker + Compose.

## Quickstart (local, mock data)

```bash
pnpm install
cp .env.example .env          # adjust if needed
docker compose up -d          # Postgres + Redis
pnpm dev                      # web on http://localhost:3000 (+ api)
```

## Quality gates

```bash
pnpm typecheck && pnpm lint && pnpm build      # JS/TS
pnpm rust:check && pnpm rust:clippy && pnpm rust:test   # Rust
```

See [PROGRESS.md](PROGRESS.md) for status and the phase plan.
