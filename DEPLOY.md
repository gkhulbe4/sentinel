# Deploying Sentinel

Targets: **web → Vercel**, **api + ingestor + matcher → Fly.io** (Docker),
**Postgres → Neon**, **Redis → Upstash**. All services talk only through Redis +
Postgres, so they deploy independently.

> The whole stack runs on **mock data** with no Helius/OpenAI keys. Add those
> later to enable real Solana ingestion and AI enrichment.

## 0. Prerequisites

- `flyctl` (Fly.io CLI), a Vercel account, a Neon project, an Upstash Redis DB.
- Optional: a Helius API key (Yellowstone gRPC) and an OpenAI API key.

## 1. Postgres (Neon)

1. Create a Neon project; copy the pooled connection string as `DATABASE_URL`
   (append `?sslmode=require`).
2. Apply migrations from your machine:
   ```bash
   DATABASE_URL="postgresql://…neon…?sslmode=require" pnpm --filter @sentinel/db exec prisma migrate deploy
   ```

## 2. Redis (Upstash)

Create a Redis database and copy the TLS connection URL as `REDIS_URL`
(`rediss://…`). ioredis (Node) and the `redis` crate (Rust) both speak TLS via
the `rediss://` scheme.

## 3. Secrets (shared)

| Var               | Used by                | Notes                                  |
| ----------------- | ---------------------- | -------------------------------------- |
| `DATABASE_URL`    | api, matcher, migrate  | Neon pooled URL                        |
| `REDIS_URL`       | api, ingestor, matcher | Upstash `rediss://…`                   |
| `JWT_SECRET`      | api (+ web AUTH)       | long random; **must match** web        |
| `CORS_ORIGIN`     | api                    | the Vercel web origin                  |
| `EVENT_SOURCE`    | ingestor               | `mock` (default) or `yellowstone`      |
| `HELIUS_GRPC_URL` | ingestor               | for `yellowstone` (see note)           |
| `HELIUS_API_KEY`  | ingestor               | for `yellowstone`                      |
| `OPENAI_API_KEY`  | matcher                | optional; heuristic fallback otherwise |
| `OPENAI_MODEL`    | matcher                | default `gpt-5.4-nano`                  |

## 4. Fly.io — api (public)

```bash
cd /repo
fly launch --no-deploy --copy-config --dockerfile apps/api/Dockerfile --config apps/api/fly.toml
fly secrets set DATABASE_URL=… REDIS_URL=… JWT_SECRET=… CORS_ORIGIN=https://<web>.vercel.app -a sentinel-api
fly deploy --config apps/api/fly.toml --dockerfile apps/api/Dockerfile .
```
Note the public URL, e.g. `https://sentinel-api.fly.dev` (WS at `wss://sentinel-api.fly.dev/ws`).

## 5. Fly.io — ingestor & matcher (workers, shared Rust image)

```bash
# ingestor
fly deploy --config rust/fly.ingestor.toml --dockerfile rust/Dockerfile .
fly secrets set REDIS_URL=… EVENT_SOURCE=mock -a sentinel-ingestor
# matcher
fly deploy --config rust/fly.matcher.toml --dockerfile rust/Dockerfile .
fly secrets set DATABASE_URL=… REDIS_URL=… OPENAI_API_KEY=… -a sentinel-matcher
```
Both are worker apps (no public port). The Rust image ships sqlx offline
metadata, so the build needs no database.

## 6. Vercel — web

Import the repo, set **Root Directory = `apps/web`**. Vercel auto-detects Next.
Env vars:

| Var                  | Value                                  |
| -------------------- | -------------------------------------- |
| `NEXT_PUBLIC_API_URL`| `https://sentinel-api.fly.dev`         |
| `NEXT_PUBLIC_WS_URL` | `wss://sentinel-api.fly.dev/ws`        |
| `AUTH_SECRET`        | long random                            |

> The web app authenticates against the API (`/auth/login`) and stores the API's
> JWT in the Auth.js session, so `JWT_SECRET` (api) and the API URL are what
> matter; the web only needs `AUTH_SECRET` for Auth.js session encryption.

Deploy. Then update the api's `CORS_ORIGIN` to the final Vercel URL and redeploy.

## 7. Verify

1. Open the Vercel URL, sign up, add a `TOKEN_SWAP` rule with min USD `1000`.
2. The dashboard shows the **Live** status and alerts streaming in (mock).
3. Each alert's risk badge + explanation patches in a moment later.

## 8. Enable real Solana (Yellowstone)

Implement the gRPC stream in `rust/ingestor/src/source/yellowstone.rs`
(`yellowstone-grpc-client`, decoding via `sentinel_core::decode`; needs `protoc`
in the Rust Dockerfile builder). Then:
```bash
fly secrets set EVENT_SOURCE=yellowstone HELIUS_GRPC_URL=… HELIUS_API_KEY=… -a sentinel-ingestor
```

## 9. AWS ECS Fargate alternative (reference)

Same images, different runtime:
- Push `sentinel-api` and `sentinel-rust` to ECR.
- **api** → a Fargate service behind an ALB (target group on `:3001`,
  sticky sessions for WebSockets).
- **ingestor** + **matcher** → two Fargate services, no load balancer (workers),
  each with its own task definition overriding the container command
  (`sentinel-ingestor` / `sentinel-matcher`).
- **Redis** → ElastiCache; **Postgres** → RDS. Run `prisma migrate deploy` as a
  one-off task before rolling out the matcher/api. Rolling deployments via the
  ECS service deployment controller.
