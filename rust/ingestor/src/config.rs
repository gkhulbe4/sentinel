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
    pub helius_grpc_url: Option<String>,
    pub helius_api_key: Option<String>,
}

impl Config {
    pub fn load() -> anyhow::Result<Self> {
        Ok(envy::from_env::<Config>()?)
    }
}
