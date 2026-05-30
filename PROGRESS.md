# Progress

**Status: complete.** All 13 phases built and verified end-to-end on mock data.

## How to run (local, mock)

```bash
pnpm install
cp .env.example .env            # adjust ports if 5432/6379 are busy
docker compose up -d            # Postgres + Redis
pnpm db:migrate                 # first time
pnpm dev                        # web :3000 + api :3001
cargo run -p sentinel-ingestor  # mock events
cargo run -p sentinel-matcher   # match + enrich
```

Sign up → add a rule → live alerts stream in with AI enrichment. See
[README.md](README.md) and [DEPLOY.md](DEPLOY.md).

## Gates

```bash
pnpm typecheck && pnpm lint && pnpm test
pnpm rust:check && pnpm rust:clippy && pnpm rust:test
```

## Phases

- **0 ✅ Scaffolding** — Turborepo + pnpm + Cargo workspace, configs, docker-compose.
- **1 ✅ DB + shared domain** — Prisma schema + migration; Rust `core`
  (types, `match_rule`, decoders, constants) with serde + ts-rs; Zod mirrors,
  helpers + tests.
- **2 ✅ API skeleton** — Fastify: Zod env, pino, `/health`, error handler, CORS,
  graceful shutdown, Prisma + ioredis.
- **3 ✅ Auth** — API JWT (bcrypt signup/login, `/auth/me`); Auth.js credentials
  in web + protected routes.
- **4 ✅ Rules CRUD** — repository + service layers, ownership-scoped REST,
  `rules:changed` publish; alert-history reads.
- **5 ✅ Rust ingestor** — `EventSource` trait, `MockEventSource` (default) +
  Yellowstone seam; bounded-channel backpressure → Redis `events`.
- **6 ✅ Rust matcher** — sqlx rule cache (refresh on `rules:changed` + timer),
  `match_rule`, persist `Alert`, publish to `alerts:{userId}`; offline `.sqlx`.
- **7 ✅ WebSocket fan-out** — JWT handshake, one Redis subscriber routing by
  userId, heartbeat, reconnect.
- **8 ✅ AI enrichment** — OpenAI Structured Outputs (reqwest) + heuristic
  fallback; async patch-in; Redis cache by signature.
- **9 ✅ Frontend** — live dashboard (virtualized feed, enrichment patch-in,
  connection status), watchlist CRUD, alert history, settings; small composed
  components + hooks.
- **10 ✅ Polish + perf** — rate limiting, dark mode, toasts, a11y, memoization;
  Rust release profile, sqlx pool, PG indexes, latency logging.
- **11 ✅ Dockerize** — cargo-chef Rust image (+ sqlx offline), slim Node image,
  `docker compose --profile full` runs the whole backend (with one-shot migrate).
- **12 ✅ Deploy** — [DEPLOY.md](DEPLOY.md) runbook + Fly/Vercel configs + ECS note.
- **13 ✅ Docs** — root + per-package READMEs; final gate pass.

## Notable decisions

- Auth: the **API owns auth** and mints an HS256 JWT; web's Auth.js delegates to
  it and stores that token — one token verified by API + WS.
- Enrichment uses **reqwest** (precise Structured-Outputs schema, build-verifiable)
  rather than `async-openai`; degrades to a local heuristic without a key.
- Yellowstone gRPC is a **documented seam** (mock is the default, runnable path);
  lighting it up needs `protoc` + a Helius key.
- Local dev uses alternate host ports (55432/6380) via `.env` when 5432/6379 are
  taken; committed defaults stay standard.
