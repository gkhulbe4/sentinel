//! Sentinel ingestor: connects to a hosted Yellowstone gRPC stream, decodes the
//! firehose into normalized `OnChainEvent`s, and publishes them to the Redis
//! `events` channel. Starts behind a `MockEventSource` (`EVENT_SOURCE=mock`).
//!
//! Real implementation lands in Phase 5.

fn main() {
    println!("{}: ingestor stub (phase 0)", sentinel_core::crate_name());
}
