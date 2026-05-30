# sentinel-matcher

Hot-path Rust binary. Subscribes to the Redis `events` channel and:

1. matches each `OnChainEvent` against an **in-memory rule cache** (loaded from
   Postgres via `sqlx`, refreshed on `rules:changed` messages + periodically),
2. on a match, inserts an `Alert` and publishes it immediately to
   `alerts:{userId}`,
3. enriches asynchronously via **OpenAI** (Structured Outputs), then publishes
   an `alert:enriched:{id}` patch — never blocking delivery.

Backpressure via bounded channels; DB/AI work runs off the consumer path.
Built in Phases 6 and 8.
