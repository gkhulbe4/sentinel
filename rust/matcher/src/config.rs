use serde::Deserialize;

fn default_refresh() -> u64 {
    30
}
fn default_db_max() -> u32 {
    5
}
fn default_model() -> String {
    "gpt-5.4-nano".to_string()
}
fn default_openai_base() -> String {
    "https://api.openai.com/v1".to_string()
}
fn default_enrich_ttl() -> u64 {
    300
}
fn default_sim_latency() -> u64 {
    500
}

#[derive(Debug, Deserialize)]
pub struct Config {
    pub database_url: String,
    pub redis_url: String,
    #[serde(default = "default_refresh")]
    pub rule_refresh_secs: u64,
    #[serde(default = "default_db_max")]
    pub db_max_connections: u32,

    // --- AI enrichment (OpenAI) ---
    /// When empty/absent, enrichment falls back to a local heuristic.
    pub openai_api_key: Option<String>,
    #[serde(default = "default_model")]
    pub openai_model: String,
    #[serde(default = "default_openai_base")]
    pub openai_base_url: String,
    #[serde(default = "default_enrich_ttl")]
    pub enrich_cache_ttl_secs: u64,
    /// Simulated latency (ms) applied only to the heuristic path so the UI's
    /// "enriching…" state is visible locally. Set 0 to disable.
    #[serde(default = "default_sim_latency")]
    pub enrich_sim_latency_ms: u64,
}

impl Config {
    pub fn load() -> anyhow::Result<Self> {
        Ok(envy::from_env::<Config>()?)
    }
}
