# sentinel-ingestor

Hot-path Rust binary. Produces normalized `OnChainEvent`s and publishes them as
JSON to the Redis `events` channel. A bounded channel between the source and the
publisher provides backpressure (events are dropped-with-a-counter, never
blocking, when the consumer falls behind).

## Sources (`EVENT_SOURCE`)

- **`mock`** (default) — `MockEventSource` emits realistic fake swaps, transfers,
  new-token launches, and wallet activity at `MOCK_EVENTS_PER_SEC`. Drives the
  whole local demo with no external dependencies.
- **`rpc`** (FREE, user-driven real data) — `WebSocketRpcEventSource` uses a
  standard Solana RPC WebSocket (Helius/QuickNode **free** tier, or the public
  endpoint). It **auto-watches the wallet addresses from users' active rules**
  (read from Postgres, refreshed every ~20s — so adding a "watch wallet X" rule
  in the UI makes the ingestor start watching X) plus any `RPC_WATCH_ACCOUNTS`
  extras. For each matching tx it calls `getTransaction` and classifies it via
  `sentinel_core::decode::classify`. No paid plan, no public URL, no `protoc`.
  Free tiers rate-limit `getTransaction`, so this fits watching specific wallets
  (not the whole chain — that's `yellowstone`). Enable with:

  ```bash
  EVENT_SOURCE=rpc \
    RPC_WS_URL=wss://mainnet.helius-rpc.com/?api-key=… \
    RPC_HTTP_URL=https://mainnet.helius-rpc.com/?api-key=… \
    cargo run -p sentinel-ingestor   # DATABASE_URL (from .env) provides the watched wallets
  ```

  Only rules that **pin a wallet** are watchable on a free RPC; market-wide rules
  (no wallet) need `yellowstone`.
- **`yellowstone`** — `YellowstoneEventSource` connects to a Helius Yellowstone
  gRPC (Geyser) stream of confirmed, non-vote transactions, reduces each to
  proto-free facts, and classifies them via `sentinel_core::decode::classify`
  (SOL transfers / swaps / new tokens / wallet activity) attaching a live
  SOL→USD price. It reconnects with a fixed backoff. **Building it needs `protoc`**
  (`brew install protobuf` / `apt-get install protobuf-compiler`). Enable with:

  ```bash
  EVENT_SOURCE=yellowstone HELIUS_GRPC_URL=… HELIUS_API_KEY=… cargo run -p sentinel-ingestor
  ```

  Classification is meta-driven (pre/post balances, token-balance deltas, logs)
  and best-effort. By default it streams the whole firehose; narrow
  `subscribe_request()`'s `account_include` to watch specific programs/wallets.

## Run

```bash
# from the repo root (.env provides REDIS_URL)
cargo run -p sentinel-ingestor
# verify:
redis-cli subscribe events
```

## Env

| Var                   | Default | Purpose                                  |
| --------------------- | ------- | ---------------------------------------- |
| `REDIS_URL`           | —       | Redis to publish `events` to (required)  |
| `EVENT_SOURCE`        | `mock`  | `mock` \| `rpc` \| `yellowstone`         |
| `MOCK_EVENTS_PER_SEC` | `2`     | Mock emission rate                       |
| `RPC_WS_URL`          | —       | WebSocket RPC (rpc mode)                 |
| `RPC_HTTP_URL`        | —       | HTTP RPC for getTransaction (rpc mode)   |
| `DATABASE_URL`        | —       | rpc mode reads watched rule wallets here |
| `RPC_WATCH_ACCOUNTS`  | —       | Extra always-watched addresses (rpc)     |
| `HELIUS_GRPC_URL`     | —       | Yellowstone endpoint (yellowstone mode)  |
| `HELIUS_API_KEY`      | —       | Helius key (yellowstone mode)            |
