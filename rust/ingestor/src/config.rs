use serde::Deserialize;

fn default_event_source() -> String {
    "mock".to_string()
}

fn default_rate() -> f64 {
    2.0
}

/// Ingestor configuration, read from the environment (see `.env.example`).
#[derive(Debug, Deserialize)]
pub struct Config {
    pub redis_url: String,
    #[serde(default = "default_event_source")]
    pub event_source: String,
    #[serde(default = "default_rate")]
    pub mock_events_per_sec: f64,

    // --- yellowstone mode (paid Helius gRPC) ---
    pub helius_grpc_url: Option<String>,
    pub helius_api_key: Option<String>,

    // --- rpc mode (free WebSocket RPC: Helius/QuickNode free tier) ---
    /// WebSocket RPC endpoint, e.g. wss://mainnet.helius-rpc.com/?api-key=…
    pub rpc_ws_url: Option<String>,
    /// HTTP RPC endpoint for getTransaction, e.g. https://mainnet.helius-rpc.com/?api-key=…
    pub rpc_http_url: Option<String>,
    /// Extra wallet/program addresses to always watch, comma-separated. In `rpc`
    /// mode this is unioned with the wallet addresses from users' active rules.
    pub rpc_watch_accounts: Option<String>,
    /// Postgres URL — `rpc` mode reads watched wallets from active rules here.
    pub database_url: Option<String>,
}

impl Config {
    pub fn load() -> anyhow::Result<Self> {
        Ok(envy::from_env::<Config>()?)
    }
}
