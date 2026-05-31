//! Sentinel ingestor: produce normalized `OnChainEvent`s from a source
//! (mock by default, or Helius Yellowstone gRPC) and publish them as JSON to
//! the Redis `events` channel. A bounded channel between the source and the
//! publisher provides backpressure.

mod config;
mod price;
mod publisher;
mod source;

use anyhow::Context;
use tokio::sync::mpsc;
use tracing::info;

use sentinel_core::OnChainEvent;

use crate::config::Config;
use crate::source::mock::MockEventSource;
use crate::source::yellowstone::YellowstoneEventSource;
use crate::source::EventSource;

const CHANNEL_CAPACITY: usize = 1024;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    init_tracing();

    let config = Config::load().context("failed to load config")?;
    info!(source = %config.event_source, "starting ingestor");

    let client = redis::Client::open(config.redis_url.clone()).context("invalid REDIS_URL")?;
    let conn = client
        .get_multiplexed_async_connection()
        .await
        .context("failed to connect to Redis")?;

    let (tx, rx) = mpsc::channel::<OnChainEvent>(CHANNEL_CAPACITY);
    let publisher = tokio::spawn(publisher::publish_loop(conn, rx));

    let source = build_source(&config)?;
    source.run(tx).await?;

    publisher.await??;
    Ok(())
}

fn build_source(config: &Config) -> anyhow::Result<Box<dyn EventSource>> {
    match config.event_source.as_str() {
        "mock" => Ok(Box::new(MockEventSource::new(config.mock_events_per_sec))),
        "yellowstone" => Ok(Box::new(YellowstoneEventSource::from_config(config)?)),
        other => anyhow::bail!("unknown EVENT_SOURCE '{other}' (expected 'mock' or 'yellowstone')"),
    }
}

fn init_tracing() {
    use tracing_subscriber::{fmt, EnvFilter};
    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    fmt().with_env_filter(filter).init();
}
