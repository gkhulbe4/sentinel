# Sentinel

A production-quality, real-time **Solana watchtower**. Create watch rules and the
instant matching on-chain activity happens, a live, AI-enriched alert is pushed
to your dashboard — typically in well under a second on mock data.

Polyglot by design: **Rust** on the hot path (ingest + match + enrich), **Node**
for the API/business layer, **Next.js** for the web app, all decoupled through
**Redis** pub/sub.

## Architecture

```
                Helius Yellowstone gRPC  (or MockEventSource by default)
                            │  raw tx/account updates
                            ▼
        ┌─────────────────────────────────────────┐
        │ rust/ingestor  decode → normalize          │
        │   OnChainEvent ──JSON──▶ Redis "events"    │
        └─────────────────────────────────────────┘
                            ▼
        ┌─────────────────────────────────────────┐
        │ rust/matcher   match_rule(event, rule)     │  in-memory rule cache
        │   on match: INSERT Alert (sqlx)            │  (refreshed on
        │   publish ServerMessage::Alert ───┐        │   "rules:changed")
        │   enrich (OpenAI) → publish patch ─┤        │
        └────────────────────────────────────┼──────┘
                                             ▼ Redis "alerts:{userId}"
        ┌─────────────────────────────────────────┐
        │ apps/api  (Fastify + ws)                   │  one Redis subscriber,
        │   WS fan-out per user · JWT · rules CRUD   │  routes by userId
        │   alert history · rate limiting            │
        └─────────────────────────────────────────┘
                            ▼ WebSocket
        ┌─────────────────────────────────────────┐
        │ apps/web  (Next.js)  live dashboard        │  prepend + enrichment
        │   virtualized feed · watchlist · history   │  patch-in
        └─────────────────────────────────────────┘
```

Rust and Node **never call each other** — Redis is the seam, so each side scales
independently. Postgres (Prisma-owned schema) is the store; Rust reads/writes it
via `sqlx` with committed offline metadata. Rust `core` types are exported to
TypeScript via `ts-rs`, and mirrored by Zod, so there is **one shared contract**.

## Layout

| Path              | What                                                       |
| ----------------- | ---------------------------------------------------------- |
| `apps/web`        | Next.js (App Router) frontend                              |
| `apps/api`        | Fastify HTTP + `ws` WebSocket service (Prisma, ioredis)    |
| `rust/crates/core`| Shared types, `match_rule`, decoders, constants (ts-rs)    |
| `rust/ingestor`   | Solana stream → normalized events → Redis                  |
| `rust/matcher`    | events → match → persist + enrich → Redis                  |
| `packages/db`     | Prisma schema + migrations (schema authority)              |
| `packages/shared` | ts-rs-generated TS types + Zod schemas + pure helpers      |
| `packages/config` | Shared ESLint / Prettier / tsconfig                        |

## Prerequisites

Node ≥ 24, pnpm 10, Rust (stable, auto-pinned via `rust-toolchain.toml`),
Docker + Compose. Optional: Helius key (real Solana) and OpenAI key (real AI).

## Run locally (mock data, no external keys)

```bash
pnpm install
cp .env.example .env            # adjust ports if 5432/6379 are taken
docker compose up -d            # Postgres + Redis
pnpm db:migrate                 # first time only

# 4 processes (separate terminals, or use the full Docker profile below)
pnpm dev                        # web :3000  + api :3001
cargo run -p sentinel-ingestor  # mock events → Redis
cargo run -p sentinel-matcher   # match → persist → enrich → publish
```

Open http://localhost:3000 → sign up → add a `TOKEN_SWAP` rule (min USD `1000`)
→ watch alerts stream into the dashboard, with risk + explanation patching in.

### Or run the whole backend in Docker

```bash
docker compose --profile full up --build    # Postgres + Redis + api + ingestor + matcher
pnpm --filter web dev                        # web still runs on the host
```

## Environment

| Var                   | Service(s)             | Default / notes                         |
| --------------------- | ---------------------- | --------------------------------------- |
| `DATABASE_URL`        | db, api, matcher       | Postgres URL                            |
| `REDIS_URL`           | api, ingestor, matcher | Redis URL                               |
| `JWT_SECRET`          | api                    | HS256 secret (≥16 chars)                |
| `CORS_ORIGIN`         | api                    | web origin (`http://localhost:3000`)    |
| `AUTH_SECRET`         | web                    | Auth.js session secret                  |
| `NEXT_PUBLIC_API_URL` | web                    | `http://localhost:3001`                 |
| `NEXT_PUBLIC_WS_URL`  | web                    | `ws://localhost:3001/ws`                |
| `EVENT_SOURCE`        | ingestor               | `mock` \| `yellowstone`                 |
| `MOCK_EVENTS_PER_SEC` | ingestor               | mock rate (default 2)                   |
| `HELIUS_GRPC_URL/KEY` | ingestor               | for `yellowstone`                       |
| `OPENAI_API_KEY`      | matcher                | optional; heuristic fallback otherwise  |
| `OPENAI_MODEL`        | matcher                | default `gpt-5.4-nano`                  |

## Quality gates

```bash
pnpm typecheck && pnpm lint && pnpm test                  # TS/JS
pnpm rust:check && pnpm rust:clippy && pnpm rust:test      # Rust (offline sqlx)
pnpm gen:types        # regenerate ts-rs TS types from Rust
pnpm db:sqlx-prepare  # regenerate sqlx offline metadata (DB up)
```

## Deploy

web → Vercel, api + ingestor + matcher → Fly.io, Postgres → Neon, Redis →
Upstash. See [DEPLOY.md](DEPLOY.md) (includes an AWS ECS Fargate alternative).

## Notes / scope

- The **mock pipeline is the runnable demo**. The Yellowstone gRPC source is a
  documented seam (`rust/ingestor/src/source/yellowstone.rs`) — wiring the live
  client needs `protoc` + a Helius key.
- AI enrichment calls OpenAI Structured Outputs when `OPENAI_API_KEY` is set,
  and otherwise falls back to a deterministic local heuristic.

See [PROGRESS.md](PROGRESS.md) for status and the phase history.
