//! AI enrichment for matched alerts. Tries OpenAI Structured Outputs when a key
//! is configured; otherwise (or on any failure) falls back to a deterministic
//! local heuristic. Results are cached in Redis by event signature so an event
//! matching several rules is only enriched once.

use std::time::Duration;

use redis::aio::MultiplexedConnection;
use redis::AsyncCommands;
use serde_json::json;
use tracing::warn;

use sentinel_core::{Enrichment, EventType, OnChainEvent, RiskFlag};

use crate::config::Config;

const CACHE_PREFIX: &str = "enrich:";
const LARGE_USD: f64 = 100_000.0;
const MAX_EXPLANATION: usize = 140;

const SYSTEM_PROMPT: &str = "You are a terse on-chain analyst. Given a normalized Solana event as \
JSON, explain it in one plain sentence (<=140 chars) and assign a risk flag. A brand-new token \
combined with a large buy is high risk.";

/// Enrich an event, using the Redis cache when possible.
pub async fn enrich_event(
    conn: &mut MultiplexedConnection,
    config: &Config,
    event: &OnChainEvent,
) -> Enrichment {
    let cache_key = format!("{CACHE_PREFIX}{}", event.signature);
    if let Ok(Some(cached)) = conn.get::<_, Option<String>>(&cache_key).await {
        if let Ok(enrichment) = serde_json::from_str::<Enrichment>(&cached) {
            return enrichment;
        }
    }

    let enrichment = match openai_enrich(config, event).await {
        Some(enrichment) => enrichment,
        None => {
            if config.enrich_sim_latency_ms > 0 {
                tokio::time::sleep(Duration::from_millis(config.enrich_sim_latency_ms)).await;
            }
            heuristic(event)
        }
    };

    if let Ok(payload) = serde_json::to_string(&enrichment) {
        let _ = conn
            .set_ex::<_, _, ()>(&cache_key, payload, config.enrich_cache_ttl_secs)
            .await;
    }
    enrichment
}

/// Call OpenAI's Chat Completions API with a strict JSON schema. Returns `None`
/// (so the caller falls back to the heuristic) when no key is set or on any error.
async fn openai_enrich(config: &Config, event: &OnChainEvent) -> Option<Enrichment> {
    let api_key = config.openai_api_key.as_deref().filter(|k| !k.is_empty())?;
    let event_json = serde_json::to_string(event).ok()?;

    let schema = json!({
        "type": "object",
        "additionalProperties": false,
        "required": ["explanation", "riskFlag", "riskReason"],
        "properties": {
            "explanation": { "type": "string" },
            "riskFlag": { "type": "string", "enum": ["none", "low", "medium", "high"] },
            "riskReason": { "type": ["string", "null"] }
        }
    });
    let body = json!({
        "model": config.openai_model,
        "messages": [
            { "role": "system", "content": SYSTEM_PROMPT },
            { "role": "user", "content": event_json }
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": { "name": "enrichment", "strict": true, "schema": schema }
        }
    });

    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{}/chat/completions", config.openai_base_url))
        .bearer_auth(api_key)
        .json(&body)
        .timeout(Duration::from_secs(15))
        .send()
        .await
        .ok()?;

    if !resp.status().is_success() {
        warn!(status = %resp.status(), "openai enrichment returned non-success; falling back");
        return None;
    }

    let parsed: ChatResponse = resp.json().await.ok()?;
    let content = parsed.choices.into_iter().next()?.message.content?;
    serde_json::from_str::<Enrichment>(&content).ok()
}

#[derive(serde::Deserialize)]
struct ChatResponse {
    choices: Vec<Choice>,
}

#[derive(serde::Deserialize)]
struct Choice {
    message: Message,
}

#[derive(serde::Deserialize)]
struct Message {
    content: Option<String>,
}

/// Deterministic local enrichment so the demo works without an API key.
fn heuristic(event: &OnChainEvent) -> Enrichment {
    let usd = event.usd_value.unwrap_or(0.0);
    let (explanation, risk_flag, risk_reason) = match event.event_type {
        EventType::NewToken => {
            let age = event.raw.get("ageSeconds").and_then(serde_json::Value::as_i64);
            let explanation = match age {
                Some(a) if a < 60 => format!("Brand-new token minted {a}s ago — verify before trading"),
                _ => "New token launch detected on-chain".to_string(),
            };
            (
                explanation,
                RiskFlag::High,
                Some("Newly created token — elevated rug/scam risk".to_string()),
            )
        }
        EventType::TokenSwap => {
            let dex = event
                .raw
                .get("dex")
                .and_then(serde_json::Value::as_str)
                .unwrap_or("a DEX");
            let symbol = event
                .raw
                .get("symbol")
                .and_then(serde_json::Value::as_str)
                .unwrap_or("token");
            let explanation = format!("{symbol} swap worth {} on {dex}", fmt_usd(usd));
            if usd >= LARGE_USD {
                (explanation, RiskFlag::Medium, Some("Large swap size".to_string()))
            } else {
                (explanation, RiskFlag::Low, None)
            }
        }
        EventType::SolTransfer => {
            let explanation = format!("SOL transfer worth ~{}", fmt_usd(usd));
            if usd >= LARGE_USD {
                (explanation, RiskFlag::Medium, Some("Large transfer".to_string()))
            } else {
                (explanation, RiskFlag::None, None)
            }
        }
        EventType::WalletActivity => (
            "Tracked wallet interaction".to_string(),
            RiskFlag::Low,
            None,
        ),
    };

    Enrichment {
        explanation: truncate(&explanation, MAX_EXPLANATION),
        risk_flag,
        risk_reason,
    }
}

fn fmt_usd(usd: f64) -> String {
    if usd >= 1_000_000.0 {
        format!("${:.1}M", usd / 1_000_000.0)
    } else if usd >= 1_000.0 {
        format!("${:.1}K", usd / 1_000.0)
    } else {
        format!("${usd:.0}")
    }
}

fn truncate(s: &str, max: usize) -> String {
    if s.chars().count() <= max {
        return s.to_string();
    }
    s.chars().take(max - 1).collect::<String>() + "…"
}
