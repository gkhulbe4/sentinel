# sentinel-matcher

Hot-path Rust binary. Subscribes to the Redis `events` channel and:

1. matches each `OnChainEvent` against an **in-memory rule cache** (loaded from
   Postgres via `sqlx`, refreshed on `rules:changed:*` messages and on a timer),
2. on a match, inserts an `Alert` (uuid id; `createdAt` defaults in the DB) and
   publishes a `ServerMessage::Alert` envelope to `alerts:{userId}`,
3. enriches asynchronously via OpenAI and publishes an `enriched` patch
   (Phase 8) — never blocking delivery.

Matching is inline and fast; persistence/publishing run on a bounded worker pool
(`MAX_CONCURRENT_JOBS`), and matched-job dispatch is itself bounded
(`JOB_CAPACITY`) so a slow DB never stalls the event consumer (drop-with-counter).

## sqlx offline

Queries are compile-time checked. Committed `rust/.sqlx/` metadata lets builds
(and Docker) compile with **no live database** when `SQLX_OFFLINE=true` (the
`pnpm rust:*` scripts set this). Regenerate after changing a query:

```bash
docker compose up -d                 # a DB to introspect
pnpm db:sqlx-prepare                 # writes rust/.sqlx (online)
```

## Run

```bash
cargo run -p sentinel-matcher        # from repo root (.env provides DATABASE_URL, REDIS_URL)
```

## Env

| Var                 | Default | Purpose                              |
| ------------------- | ------- | ------------------------------------ |
| `DATABASE_URL`      | —       | Postgres (rules + alerts)            |
| `REDIS_URL`         | —       | events in, alerts out                |
| `RULE_REFRESH_SECS` | `30`    | periodic rule-cache refresh          |
| `DB_MAX_CONNECTIONS`| `5`     | sqlx pool size                       |
