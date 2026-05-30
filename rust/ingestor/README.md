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
  gRPC stream and decodes updates via `sentinel_core::decode`. The gRPC client
  (`yellowstone-grpc-client`) is **not compiled into this build** — it needs
  `protoc` at build time and a live Helius endpoint + key, so it's left as a
  documented seam. Selecting it without wiring it up exits with a clear error.

  To enable: add `yellowstone-grpc-client`/`yellowstone-grpc-proto` deps, install
  `protoc`, implement `run()` to subscribe to transactions and call the
  `decode_*` helpers, then set `EVENT_SOURCE=yellowstone`, `HELIUS_GRPC_URL`, and
  `HELIUS_API_KEY`.

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
