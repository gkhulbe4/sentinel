// Pure, single-purpose helpers. No side effects; `now` is injectable for tests.

import {
  LAMPORTS_PER_SOL,
  SOLSCAN_ACCOUNT_BASE,
  SOLSCAN_TX_BASE,
} from "./constants";

/** `So1111…1112` → `So11…1112`. Leaves short strings untouched. */
export function shortenAddress(addr: string, chars = 4): string {
  if (addr.length <= chars * 2 + 1) return addr;
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

export function formatSol(sol: number, maxFractionDigits = 4): string {
  const n = new Intl.NumberFormat("en-US", { maximumFractionDigits: maxFractionDigits }).format(sol);
  return `${n} SOL`;
}

/** USD value of a SOL amount at a given SOL→USD price. */
export function usdValue(amountSol: number, solUsdPrice: number): number {
  return amountSol * solUsdPrice;
}

export function formatUsd(usd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: usd !== 0 && Math.abs(usd) < 1 ? 4 : 2,
  }).format(usd);
}

export function solscanTx(signature: string): string {
  return `${SOLSCAN_TX_BASE}${signature}`;
}

export function solscanAccount(addr: string): string {
  return `${SOLSCAN_ACCOUNT_BASE}${addr}`;
}

/** Compact "12s ago" / "3m ago" / "5h ago" / "2d ago" from an ISO timestamp. */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  const seconds = Math.max(0, Math.floor((now - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
