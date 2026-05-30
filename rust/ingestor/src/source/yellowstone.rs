use tokio::sync::mpsc;
use tracing::warn;

use sentinel_core::OnChainEvent;

use super::EventSource;
use crate::config::Config;

/// Helius Yellowstone gRPC (Geyser) source.
///
/// The pure decode seam lives in `sentinel_core::decode` (`decode_transfer`,
/// `decode_swap`, `decode_new_token`). Wiring the live stream needs the
/// `yellowstone-grpc-client` crate (which requires `protoc` at build time) plus
/// a Helius endpoint + API key — see `ingestor/README.md`. It is intentionally
/// not compiled into this build so the mock pipeline stays dependency-light.
pub struct YellowstoneEventSource {
    endpoint: String,
    _api_key: Option<String>,
}

impl YellowstoneEventSource {
    pub fn from_config(config: &Config) -> anyhow::Result<Self> {
        let endpoint = config
            .helius_grpc_url
            .clone()
            .ok_or_else(|| anyhow::anyhow!("HELIUS_GRPC_URL is required for EVENT_SOURCE=yellowstone"))?;
        Ok(Self {
            endpoint,
            _api_key: config.helius_api_key.clone(),
        })
    }
}

#[async_trait::async_trait]
impl EventSource for YellowstoneEventSource {
    async fn run(self: Box<Self>, _tx: mpsc::Sender<OnChainEvent>) -> anyhow::Result<()> {
        warn!(endpoint = %self.endpoint, "Yellowstone source selected but the gRPC client is not compiled into this build");
        anyhow::bail!(
            "Yellowstone source is not wired in this build. Use EVENT_SOURCE=mock, or implement the \
             gRPC stream with yellowstone-grpc-client decoding via sentinel_core::decode (see ingestor/README.md)."
        )
    }
}
