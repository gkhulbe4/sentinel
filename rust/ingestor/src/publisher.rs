use redis::aio::MultiplexedConnection;
use redis::AsyncCommands;
use tokio::sync::mpsc;
use tracing::{error, info};

use sentinel_core::constants::CHANNEL_EVENTS;
use sentinel_core::OnChainEvent;

/// Drain the channel and publish each event as JSON to the Redis `events` channel.
pub async fn publish_loop(
    mut conn: MultiplexedConnection,
    mut rx: mpsc::Receiver<OnChainEvent>,
) -> anyhow::Result<()> {
    let mut count: u64 = 0;
    while let Some(event) = rx.recv().await {
        match serde_json::to_string(&event) {
            Ok(payload) => {
                if let Err(err) = conn.publish::<_, _, ()>(CHANNEL_EVENTS, payload).await {
                    error!(%err, "failed to publish event");
                } else {
                    count += 1;
                    if count.is_multiple_of(50) {
                        info!(count, "events published");
                    }
                }
            }
            Err(err) => error!(%err, "failed to serialize event"),
        }
    }
    Ok(())
}
