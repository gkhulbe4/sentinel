# api

Node service: **Fastify** (HTTP) + **`ws`** (WebSocket). It owns:

- JWT verification (tokens minted by Auth.js in `web`),
- CRUD for watch rules / wallets (Prisma), alert-history reads,
- the **WebSocket fan-out**: each client subscribes to its `alerts:{userId}`
  Redis channel and receives live alerts.

It never talks to the Solana stream — that's the Rust `ingestor`/`matcher`,
which reach the API only through Redis.

## Run

```bash
pnpm --filter api dev    # tsx watch (placeholder until Phase 2)
pnpm --filter api build  # tsup -> dist/
```

Env: copy `.env.example` → `.env`. Built out in Phase 2.
