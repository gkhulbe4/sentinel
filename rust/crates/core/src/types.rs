//! The shared event/rule/alert contract. Serialized as camelCase JSON over
//! Redis and exported to TypeScript via `ts-rs` so Rust, the Node API, and the
//! frontend agree on one shape. Optional fields serialize as `null`.

use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// The kind of on-chain activity an event represents and that a rule targets.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[ts(export, export_to = "../../../../packages/shared/generated/")]
pub enum EventType {
    SolTransfer,
    TokenSwap,
    NewToken,
    WalletActivity,
}

/// Risk classification produced by the AI enrichment layer.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "lowercase")]
#[ts(export, export_to = "../../../../packages/shared/generated/")]
pub enum RiskFlag {
    None,
    Low,
    Medium,
    High,
}

/// A normalized on-chain event — the contract between the ingestor and matcher.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../../../packages/shared/generated/")]
pub struct OnChainEvent {
    pub signature: String,
    #[ts(type = "number")]
    pub slot: u64,
    pub event_type: EventType,
    pub wallet: String,
    pub counterparty: Option<String>,
    pub amount_sol: Option<f64>,
    pub usd_value: Option<f64>,
    pub token_mint: Option<String>,
    /// Free-form decoded detail for display/debugging.
    #[ts(type = "unknown")]
    pub raw: serde_json::Value,
}

/// The matcher's view of a watch rule (subset of the DB row needed to match).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../../../packages/shared/generated/")]
pub struct WatchRule {
    pub id: String,
    pub user_id: String,
    pub event_type: EventType,
    pub wallet_addr: Option<String>,
    pub min_usd: Option<f64>,
    pub is_active: bool,
}

/// AI enrichment attached to an alert.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../../../packages/shared/generated/")]
pub struct Enrichment {
    pub explanation: String,
    pub risk_flag: RiskFlag,
    pub risk_reason: Option<String>,
}

/// An alert as published to `alerts:{userId}` and shown in the dashboard.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../../../packages/shared/generated/")]
pub struct Alert {
    pub id: String,
    pub user_id: String,
    pub rule_id: String,
    pub event_type: EventType,
    pub signature: String,
    pub event: OnChainEvent,
    pub explanation: Option<String>,
    pub risk_flag: Option<RiskFlag>,
    pub risk_reason: Option<String>,
    /// RFC3339 timestamp.
    pub created_at: String,
}

/// Patch applied to an existing alert once enrichment completes.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../../../packages/shared/generated/")]
pub struct AlertEnrichedPatch {
    pub id: String,
    pub explanation: String,
    pub risk_flag: RiskFlag,
    pub risk_reason: Option<String>,
}

/// Envelope published to the per-user `alerts:{userId}` channel and relayed by
/// the WebSocket server. The discriminant lets the frontend tell a brand-new
/// alert from an enrichment patch on a single subscription.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[serde(tag = "type", content = "data", rename_all = "lowercase")]
#[ts(export, export_to = "../../../../packages/shared/generated/")]
pub enum ServerMessage {
    // Boxed: `Alert` is much larger than `AlertEnrichedPatch`; boxing keeps the
    // enum small. Transparent to serde JSON and ts-rs (still `data: Alert`).
    Alert(Box<Alert>),
    Enriched(AlertEnrichedPatch),
}
