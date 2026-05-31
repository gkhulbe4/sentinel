# sentinel-ingestor

Hot-path Rust binary. Produces normalized `OnChainEvent`s and publishes them as
JSON to the Redis `events` channel. A bounded channel between the source and the
publisher provides backpressure (events are dropped-with-a-counter, never
blocking, when the consumer falls behind).

## Sources (`EVENT_SOURCE`)

- **`mock`** (default) — `MockEventSource` emits realistic fake swaps, transfers,
  new-token launches, and wallet activity at `MOCK_EVENTS_PER_SEC`. Drives the
  whole local demo with no external dependencies.
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
| `EVENT_SOURCE`        | `mock`  | `mock` \| `yellowstone`                  |
| `MOCK_EVENTS_PER_SEC` | `2`     | Mock emission rate                       |
| `HELIUS_GRPC_URL`     | —       | Yellowstone endpoint (yellowstone mode)  |
| `HELIUS_API_KEY`      | —       | Helius key (yellowstone mode)            |
