import type { EventType, OnChainEvent } from "@sentinel/shared";

/**
 * Normalize Helius "Enhanced" webhook transactions into Sentinel `OnChainEvent`s.
 * Helius pre-decodes each transaction (type, native/token transfers, a human
 * description), so we map that onto our event contract rather than parsing raw
 * Solana instructions ourselves.
 *
 * Docs: https://docs.helius.dev/data-streaming/webhooks (Enhanced payload).
 */

interface NativeTransfer {
  fromUserAccount?: string;
  toUserAccount?: string;
  amount?: number; // lamports
}
interface TokenTransfer {
  fromUserAccount?: string;
  toUserAccount?: string;
  mint?: string;
  tokenAmount?: number;
}
export interface HeliusTxn {
  signature?: string;
  slot?: number;
  type?: string;
  source?: string;
  description?: string;
  feePayer?: string;
  nativeTransfers?: NativeTransfer[];
  tokenTransfers?: TokenTransfer[];
}

const LAMPORTS_PER_SOL = 1_000_000_000;

/** Map a Helius transaction `type` to a Sentinel event type. */
function eventTypeFor(t: HeliusTxn): EventType {
  const type = (t.type ?? "").toUpperCase();
  if (type === "SWAP") return "TOKEN_SWAP";
  if (type.includes("MINT") || type === "CREATE" || type === "CREATE_POOL") return "NEW_TOKEN";
  const hasNative = (t.nativeTransfers ?? []).some((n) => (n.amount ?? 0) > 0);
  if (type === "TRANSFER" && hasNative && (t.tokenTransfers ?? []).length === 0) {
    return "SOL_TRANSFER";
  }
  return "WALLET_ACTIVITY";
}

/** Largest native transfer (lamports) in the txn, if any. */
function largestNative(t: HeliusTxn): NativeTransfer | null {
  let best: NativeTransfer | null = null;
  for (const n of t.nativeTransfers ?? []) {
    if (!best || (n.amount ?? 0) > (best.amount ?? 0)) best = n;
  }
  return best && (best.amount ?? 0) > 0 ? best : null;
}

export function normalizeHeliusTxn(t: HeliusTxn, solPriceUsd: number | null): OnChainEvent | null {
  if (!t.signature || !t.feePayer) return null;

  const eventType = eventTypeFor(t);
  const native = largestNative(t);
  const amountSol = native ? (native.amount ?? 0) / LAMPORTS_PER_SOL : null;
  const usdValue =
    amountSol != null && solPriceUsd != null ? Number((amountSol * solPriceUsd).toFixed(2)) : null;

  const tokenTransfer = (t.tokenTransfers ?? [])[0] ?? null;
  const tokenMint = tokenTransfer?.mint ?? null;
  const counterparty =
    native?.toUserAccount && native.toUserAccount !== t.feePayer
      ? native.toUserAccount
      : (tokenTransfer?.toUserAccount ?? null);

  return {
    signature: t.signature,
    slot: t.slot ?? 0,
    eventType,
    wallet: t.feePayer,
    counterparty: counterparty ?? null,
    amountSol,
    usdValue,
    tokenMint,
    raw: {
      source: t.source ?? null,
      type: t.type ?? null,
      description: t.description ?? null,
    },
  };
}

export function normalizeHeliusTxns(txns: HeliusTxn[], solPriceUsd: number | null): OnChainEvent[] {
  return txns.map((t) => normalizeHeliusTxn(t, solPriceUsd)).filter((e): e is OnChainEvent => e !== null);
}
