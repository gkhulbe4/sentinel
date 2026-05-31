//! Sentinel matcher: consume the Redis `events` channel, match each event
//! against an in-memory cache of active rules, persist matched alerts, and
//! publish them to the per-user `alerts:{userId}` channel. Matching is inline
//! and fast; DB work runs on a bounded worker pool so a slow database never
//! blocks event consumption. AI analysis is computed on demand by the API when
//! a user opens an alert (see apps/api `POST /alerts/:id/enrich`).

mod cache;
mod config;
mod db;

use std::sync::Arc;
use std::time::{Duration, Instant};

use anyhow::Context;
use futures_util::StreamExt;
use redis::aio::MultiplexedConnection;
use redis::AsyncCommands;
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use tokio::sync::{mpsc, Semaphore};
use tokio::time::{interval, MissedTickBehavior};
use tracing::{debug, error, info, warn};
use uuid::Uuid;

use sentinel_core::constants::{channel_alerts, CHANNEL_EVENTS, CHANNEL_RULES_CHANGED_PREFIX};
use sentinel_core::{Alert, OnChainEvent, ServerMessage, WatchRule};

use crate::cache::RuleCache;
use crate::config::Config;

const JOB_CAPACITY: usize = 2048;
const MAX_CONCURRENT_JOBS: usize = 16;

struct AlertJob {
    event: OnChainEvent,
    rule: WatchRule,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    init_tracing();
    let config = Arc::new(Config::load().context("failed to load config")?);

    let pool = PgPoolOptions::new()
        .max_connections(config.db_max_connections)
        .connect(&config.database_url)
        .await
        .context("failed to connect to Postgres")?;

    let redis_client = redis::Client::open(config.redis_url.clone()).context("invalid REDIS_URL")?;
    let publish_conn = redis_client
        .get_multiplexed_async_connection()
        .await
        .context("failed to connect to Redis")?;

    let cache = RuleCache::new();
    cache.replace(db::load_active_rules(&pool).await?).await;
    info!(rules = cache.len().await, "loaded active rules");

    let (job_tx, job_rx) = mpsc::channel::<AlertJob>(JOB_CAPACITY);
    tokio::spawn(worker_loop(job_rx, pool.clone(), publish_conn));
    tokio::spawn(periodic_refresh(pool.clone(), cache.clone(), config.rule_refresh_secs));

    run_event_loop(&redis_client, cache, pool, job_tx).await
}

/// Subscribe to events + rules:changed and dispatch matched alert jobs.
async fn run_event_loop(
    client: &redis::Client,
    cache: RuleCache,
    pool: PgPool,
    job_tx: mpsc::Sender<AlertJob>,
) -> anyhow::Result<()> {
    let mut pubsub = client.get_async_pubsub().await.context("pubsub connect")?;
    pubsub.subscribe(CHANNEL_EVENTS).await?;
    pubsub
        .psubscribe(format!("{CHANNEL_RULES_CHANGED_PREFIX}*"))
        .await?;
    info!("subscribed to events + rules:changed");

    let mut dropped: u64 = 0;
    let mut stream = pubsub.on_message();
    while let Some(msg) = stream.next().await {
        let channel = msg.get_channel_name().to_string();
        let payload: String = match msg.get_payload() {
            Ok(p) => p,
            Err(err) => {
                warn!(%err, "non-string payload");
                continue;
            }
        };

        if channel == CHANNEL_EVENTS {
            match serde_json::from_str::<OnChainEvent>(&payload) {
                Ok(event) => {
                    for rule in cache.matches(&event).await {
                        let job = AlertJob {
                            event: event.clone(),
                            rule,
                        };
                        if job_tx.try_send(job).is_err() {
                            dropped += 1;
                            if dropped.is_multiple_of(100) {
                                warn!(dropped, "backpressure: dropping alert jobs");
                            }
                        }
                    }
                }
                Err(err) => warn!(%err, "failed to parse event"),
            }
        } else if channel.starts_with(CHANNEL_RULES_CHANGED_PREFIX) {
            let pool = pool.clone();
            let cache = cache.clone();
            tokio::spawn(async move {
                match db::load_active_rules(&pool).await {
                    Ok(rules) => {
                        let count = rules.len();
                        cache.replace(rules).await;
                        info!(rules = count, "rule cache refreshed (rules:changed)");
                    }
                    Err(err) => error!(%err, "rules refresh failed"),
                }
            });
        }
    }
    Ok(())
}

/// Bounded worker pool: each job persists + publishes an alert.
async fn worker_loop(
    mut rx: mpsc::Receiver<AlertJob>,
    pool: PgPool,
    conn: MultiplexedConnection,
) {
    let sem = Arc::new(Semaphore::new(MAX_CONCURRENT_JOBS));
    while let Some(job) = rx.recv().await {
        let Ok(permit) = sem.clone().acquire_owned().await else {
            break;
        };
        let pool = pool.clone();
        let conn = conn.clone();
        tokio::spawn(async move {
            let _permit = permit;
            if let Err(err) = process_job(&pool, conn, job).await {
                error!(%err, "alert job failed");
            }
        });
    }
}

async fn process_job(
    pool: &PgPool,
    mut conn: MultiplexedConnection,
    job: AlertJob,
) -> anyhow::Result<()> {
    let started = Instant::now();
    let AlertJob { event, rule } = job;
    let id = Uuid::new_v4().to_string();
    let created_at = chrono::Utc::now().to_rfc3339();
    let payload = serde_json::to_value(&event)?;
    let channel = channel_alerts(&rule.user_id);

    db::insert_alert(
        pool,
        &id,
        &rule.user_id,
        &rule.id,
        event.event_type.as_db_str(),
        &event.signature,
        &payload,
    )
    .await?;

    // Deliver the alert immediately. AI analysis (explanation + risk) is computed
    // on demand by the API when the user opens the alert, not eagerly here.
    let alert = Alert {
        id,
        user_id: rule.user_id.clone(),
        rule_id: rule.id,
        event_type: event.event_type,
        signature: event.signature.clone(),
        event: event.clone(),
        explanation: None,
        risk_flag: None,
        risk_reason: None,
        created_at,
    };
    let json = serde_json::to_string(&ServerMessage::Alert(Box::new(alert)))?;
    let _: () = conn.publish(&channel, json).await?;
    // Match -> deliver latency (perf budget §8: p95 < 150ms). Enable with RUST_LOG=debug.
    debug!(elapsed_ms = started.elapsed().as_millis() as u64, "alert delivered");
    Ok(())
}

async fn periodic_refresh(pool: PgPool, cache: RuleCache, secs: u64) {
    let mut ticker = interval(Duration::from_secs(secs.max(5)));
    ticker.set_missed_tick_behavior(MissedTickBehavior::Skip);
    loop {
        ticker.tick().await;
        match db::load_active_rules(&pool).await {
            Ok(rules) => cache.replace(rules).await,
            Err(err) => error!(%err, "periodic rules refresh failed"),
        }
    }
}

fn init_tracing() {
    use tracing_subscriber::{fmt, EnvFilter};
    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    fmt().with_env_filter(filter).init();
}
