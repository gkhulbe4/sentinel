import {
  EVENT_TYPE_LABELS,
  type OnChainEvent,
  formatSol,
  formatUsd,
  shortenAddress,
} from "@sentinel/shared";

/** A one-line human summary of an event for the alert card. Pure. */
export function summarizeEvent(event: OnChainEvent): string {
  const usd = event.usdValue != null ? formatUsd(event.usdValue) : null;
  const raw = (event.raw ?? {}) as { symbol?: string; dex?: string; ageSeconds?: number };

  switch (event.eventType) {
    case "SOL_TRANSFER":
      return `${event.amountSol != null ? formatSol(event.amountSol) : "SOL"} transfer${usd ? ` (${usd})` : ""}`;
    case "TOKEN_SWAP":
      return `${raw.symbol ?? "Token"} swap${usd ? ` worth ${usd}` : ""}${raw.dex ? ` on ${raw.dex}` : ""}`;
    case "NEW_TOKEN":
      return `New token${event.tokenMint ? ` ${shortenAddress(event.tokenMint)}` : ""}`;
    case "WALLET_ACTIVITY":
      return `Activity from ${shortenAddress(event.wallet)}`;
    default:
      return EVENT_TYPE_LABELS[event.eventType] ?? "On-chain event";
  }
}
