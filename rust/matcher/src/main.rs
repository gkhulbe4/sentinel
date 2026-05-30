//! Sentinel matcher: consumes the Redis `events` channel, matches each event
//! against an in-memory cache of active rules (loaded from Postgres via sqlx),
//! persists matched `Alert`s, enriches them via OpenAI, and publishes to the
//! per-user `alerts:{userId}` channel.
//!
//! Real implementation lands in Phase 6 (matching) and Phase 8 (enrichment).

fn main() {
    println!("{}: matcher stub (phase 0)", sentinel_core::crate_name());
}
