"use client";

import { useEffect, useState } from "react";
import { type Alert, type EventType, type RiskFlag, formatUsd } from "@sentinel/shared";

/**
 * Client-side stream of realistic SAMPLE alerts — used on the dashboard when no
 * real wallet activity is flowing (free RPC isn't watching a wallet yet), so the
 * feed shows events arriving one-by-one like the live pipeline. Clearly labelled
 * as sample data in the UI; real WebSocket alerts take over the moment they arrive.
 */

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const DEXES = ["Jupiter", "Raydium", "Orca", "Meteora"];
const SYMBOLS = ["USDC", "BONK", "WIF", "JUP", "PYTH", "JTO", "WEN", "POPCAT"];
const SOL_USD = 165;

const rand58 = (len: number) =>
  Array.from({ length: len }, () => BASE58[Math.floor(Math.random() * BASE58.length)]).join("");
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)] as T;

function makeSampleAlert(): Alert {
  const eventType = pick<EventType>([
    "TOKEN_SWAP",
    "TOKEN_SWAP",
    "SOL_TRANSFER",
    "NEW_TOKEN",
    "WALLET_ACTIVITY",
  ]);
  const signature = rand58(72);
  const wallet = rand58(44);
  const slot = 423_400_000 + Math.floor(Math.random() * 200_000);

  let counterparty: string | null = null;
  let amountSol: number | null = null;
  let usdValue: number | null = null;
  let tokenMint: string | null = null;
  let raw: Record<string, unknown> = { source: "sample" };
  let explanation = "";
  let riskFlag: RiskFlag = "low";
  let riskReason: string | null = null;

  if (eventType === "TOKEN_SWAP") {
    usdValue = Math.round(20 + Math.random() * 250_000);
    amountSol = Number((usdValue / SOL_USD).toFixed(2));
    tokenMint = rand58(44);
    const sym = pick(SYMBOLS);
    const dex = pick(DEXES);
    raw = { source: "sample", symbol: sym, dex };
    const large = usdValue >= 100_000;
    explanation = `${sym} swap worth ${formatUsd(usdValue)} on ${dex}.`;
    riskFlag = large ? "medium" : "low";
    riskReason = large ? "Large swap size" : null;
  } else if (eventType === "SOL_TRANSFER") {
    amountSol = Number((0.1 + Math.random() * 4000).toFixed(2));
    usdValue = Math.round(amountSol * SOL_USD);
    counterparty = rand58(44);
    const large = usdValue >= 100_000;
    explanation = `SOL transfer worth ~${formatUsd(usdValue)}.`;
    riskFlag = large ? "medium" : "none";
    riskReason = large ? "Large transfer" : null;
  } else if (eventType === "NEW_TOKEN") {
    tokenMint = rand58(44);
    const age = Math.floor(1 + Math.random() * 120);
    raw = { source: "sample", program: "pump.fun", ageSeconds: age };
    explanation =
      age < 60
        ? `Brand-new token minted ${age}s ago — verify before trading.`
        : "New token launch detected on-chain.";
    riskFlag = "high";
    riskReason = "Newly created token — elevated rug/scam risk";
  } else {
    amountSol = Number((0.001 + Math.random() * 25).toFixed(3));
    usdValue = Math.round(amountSol * SOL_USD);
    explanation = "Tracked wallet interacted with a program.";
    riskFlag = "low";
  }

  return {
    id: `sample-${signature.slice(0, 12)}`,
    userId: "sample",
    ruleId: "sample",
    eventType,
    signature,
    event: { signature, slot, eventType, wallet, counterparty, amountSol, usdValue, tokenMint, raw },
    explanation,
    riskFlag,
    riskReason,
    createdAt: new Date().toISOString(),
  };
}

const SEED = 4;
const MAX = 40;
const INTERVAL_MS = 2600;

export function useSampleStream(active: boolean): Alert[] {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!active) return;
    setAlerts(Array.from({ length: SEED }, makeSampleAlert));
    const id = setInterval(() => {
      setAlerts((prev) => [makeSampleAlert(), ...prev].slice(0, MAX));
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [active]);

  return alerts;
}
