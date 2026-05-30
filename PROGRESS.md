# Progress

## Done

- **Phase 0 — Scaffolding.** Polyglot monorepo skeleton:
  - pnpm + Turborepo (JS) over `apps/{web,api}` + `packages/{config,shared,db}`.
  - Cargo workspace (`rust/`): `sentinel-core` lib + `sentinel-ingestor` /
    `sentinel-matcher` binary stubs. Toolchain pinned to stable (edition 2021).
  - `packages/config`: shared flat ESLint (TS, no-`any`), Prettier, strict
    tsconfig presets.
  - `apps/web`: Next 15 App Router skeleton (Tailwind v4) that boots.
  - `apps/api`: Fastify-service skeleton (tsx/tsup placeholder).
  - `docker-compose.yml`: Postgres 16 + Redis 7 with healthchecks.
  - `.env.example` files, root scripts (JS + `rust:*`), git initialized.

## Next

- **Phase 1 — DB schema + shared domain.** Prisma schema in `packages/db`
  (User / WatchRule / Alert) + first migration. Rust `core` domain
  (`OnChainEvent`, `WatchRule`, `EventType`, `Alert`) with `serde` + `ts-rs`,
  `match_rule()` + decode stubs + constants. Export TS into
  `packages/shared/generated`; add Zod mirrors + JS helpers. Tests:
  `cargo test` per rule type; TS types compile.

## How to run

```bash
pnpm install
cp .env.example .env
docker compose up -d            # Postgres + Redis
pnpm dev                        # web :3000 (+ api placeholder)

# Rust services (stubs for now)
cargo run -p sentinel-ingestor
cargo run -p sentinel-matcher
```

## Gates

```bash
pnpm typecheck && pnpm lint && pnpm build
pnpm rust:check && pnpm rust:clippy && pnpm rust:test
```

## Phase roadmap

0 ✅ Scaffolding · 1 DB + shared domain · 2 API skeleton · 3 Auth ·
4 Rules CRUD · 5 Rust ingestor (mock) · 6 Rust matcher · 7 WS fan-out ·
8 OpenAI enrichment · 9 Frontend · 10 Polish + perf · 11 Dockerize ·
12 Deploy · 13 Docs.
