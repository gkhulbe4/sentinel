use std::sync::Arc;

use sentinel_core::{match_rule, OnChainEvent, WatchRule};
use tokio::sync::RwLock;

/// Thread-safe, in-memory snapshot of active rules. Matching reads under a
/// short-lived read lock; refreshes swap the whole vector under a write lock.
#[derive(Clone, Default)]
pub struct RuleCache {
    rules: Arc<RwLock<Vec<WatchRule>>>,
}

impl RuleCache {
    pub fn new() -> Self {
        Self::default()
    }

    pub async fn replace(&self, rules: Vec<WatchRule>) {
        *self.rules.write().await = rules;
    }

    /// All active rules that match `event` (cloned so the lock is released fast).
    pub async fn matches(&self, event: &OnChainEvent) -> Vec<WatchRule> {
        self.rules
            .read()
            .await
            .iter()
            .filter(|rule| match_rule(event, rule))
            .cloned()
            .collect()
    }

    pub async fn len(&self) -> usize {
        self.rules.read().await.len()
    }
}
