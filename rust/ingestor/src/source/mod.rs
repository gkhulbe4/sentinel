use sentinel_core::OnChainEvent;
use tokio::sync::mpsc;

pub mod mock;
pub mod yellowstone;

/// A source of normalized on-chain events. Implementations push events into the
/// bounded channel; the publisher drains it onto Redis.
#[async_trait::async_trait]
pub trait EventSource: Send {
    async fn run(self: Box<Self>, tx: mpsc::Sender<OnChainEvent>) -> anyhow::Result<()>;
}
