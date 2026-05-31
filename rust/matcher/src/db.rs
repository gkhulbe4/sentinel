use sentinel_core::{EventType, WatchRule};
use sqlx::PgPool;

/// Load all active rules from Postgres into the matcher's view.
pub async fn load_active_rules(pool: &PgPool) -> anyhow::Result<Vec<WatchRule>> {
    let rows = sqlx::query!(
        r#"
        SELECT
            id           AS "id!",
            "userId"     AS "user_id!",
            "eventType"  AS "event_type!",
            "walletAddr" AS "wallet_addr?",
            "minUsd"     AS "min_usd?",
            "isActive"   AS "is_active!"
        FROM "WatchRule"
        WHERE "isActive" = true
        "#
    )
    .fetch_all(pool)
    .await?;

    let rules = rows
        .into_iter()
        .filter_map(|r| {
            Some(WatchRule {
                event_type: EventType::from_db_str(&r.event_type)?,
                id: r.id,
                user_id: r.user_id,
                wallet_addr: r.wallet_addr,
                min_usd: r.min_usd,
                is_active: r.is_active,
            })
        })
        .collect();
    Ok(rules)
}

/// Insert a matched alert. `createdAt` defaults to now() in the DB.
#[allow(clippy::too_many_arguments)]
pub async fn insert_alert(
    pool: &PgPool,
    id: &str,
    user_id: &str,
    rule_id: &str,
    event_type: &str,
    signature: &str,
    payload: &serde_json::Value,
) -> anyhow::Result<()> {
    sqlx::query!(
        r#"
        INSERT INTO "Alert" (id, "userId", "ruleId", "eventType", signature, payload)
        VALUES ($1, $2, $3, $4, $5, $6)
        "#,
        id,
        user_id,
        rule_id,
        event_type,
        signature,
        payload
    )
    .execute(pool)
    .await?;
    Ok(())
}
