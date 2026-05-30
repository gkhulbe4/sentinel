# sentinel-ingestor

Hot-path Rust binary. Connects to a hosted Solana **Yellowstone gRPC** Geyser
stream (Helius), decodes updates into normalized `OnChainEvent`s, and publishes
them as JSON to the Redis `events` channel.

- `EventSource` trait with `MockEventSource` (default, `EVENT_SOURCE=mock`) and
  `YellowstoneEventSource` (`EVENT_SOURCE=yellowstone`).
- Bounded internal channel for backpressure; logs drop counts under load.
- Does **not** run a validator and never calls the Node API directly.

Run (after Phase 5): `cargo run -p sentinel-ingestor`. Built in Phase 5.
