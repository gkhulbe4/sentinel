use serde::Deserialize;

fn default_refresh() -> u64 {
    30
}
fn default_db_max() -> u32 {
    5
}

#[derive(Debug, Deserialize)]
pub struct Config {
    pub database_url: String,
    pub redis_url: String,
    #[serde(default = "default_refresh")]
    pub rule_refresh_secs: u64,
    #[serde(default = "default_db_max")]
    pub db_max_connections: u32,
}

impl Config {
    pub fn load() -> anyhow::Result<Self> {
        Ok(envy::from_env::<Config>()?)
    }
}
