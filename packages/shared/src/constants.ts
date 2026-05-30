// Named constants shared across the stack. Mirrors `rust/crates/core/constants.rs`.

import type { EventType, RiskFlag } from "../generated";

/** Redis channel the ingestor publishes normalized events to. */
export const CHANNEL_EVENTS = "events";
export const CHANNEL_ALERTS_PREFIX = "alerts:";
export const CHANNEL_RULES_CHANGED_PREFIX = "rules:changed:";

/** Per-user channel carrying `ServerMessage` envelopes (alerts + enrichment). */
export const channelAlerts = (userId: string): string => `${CHANNEL_ALERTS_PREFIX}${userId}`;
/** Per-user cache-invalidation channel the API publishes to on rule changes. */
export const channelRulesChanged = (userId: string): string =>
  `${CHANNEL_RULES_CHANGED_PREFIX}${userId}`;

export const EVENT_TYPES = [
  "SOL_TRANSFER",
  "TOKEN_SWAP",
  "NEW_TOKEN",
  "WALLET_ACTIVITY",
] as const satisfies readonly EventType[];

export const RISK_FLAGS = ["none", "low", "medium", "high"] as const satisfies readonly RiskFlag[];

/** Human labels for event types (UI). */
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  SOL_TRANSFER: "SOL transfer",
  TOKEN_SWAP: "Token swap",
  NEW_TOKEN: "New token",
  WALLET_ACTIVITY: "Wallet activity",
};

export const LAMPORTS_PER_SOL = 1_000_000_000;
export const SOLSCAN_TX_BASE = "https://solscan.io/tx/";
export const SOLSCAN_ACCOUNT_BASE = "https://solscan.io/account/";

/** WebSocket close code used when the JWT handshake fails. */
export const WS_CLOSE_UNAUTHORIZED = 4401;
