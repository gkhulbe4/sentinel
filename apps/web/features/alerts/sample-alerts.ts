import type { Alert } from "@sentinel/shared";

/**
 * Demo alerts shown on the dashboard before any real wallet activity has
 * matched (e.g. a fresh account, or the free RPC isn't watching a wallet yet).
 * Pre-enriched so the "Open" dialog shows analysis without an API call. Clearly
 * labelled as sample data in the UI.
 */
const now = Date.now();
const ago = (seconds: number) => new Date(now - seconds * 1000).toISOString();

export const SAMPLE_ALERTS: Alert[] = [
  {
    id: "sample-token-swap",
    userId: "sample",
    ruleId: "sample",
    eventType: "TOKEN_SWAP",
    signature: "5tZerekN22mjZz1XJ5iqWkUqKujpmhTJfJfmDAJLnx352omKv6XfiX6qpMEd18Uj4Gu",
    event: {
      signature: "5tZerekN22mjZz1XJ5iqWkUqKujpmhTJfJfmDAJLnx352omKv6XfiX6qpMEd18Uj4Gu",
      slot: 423_399_333,
      eventType: "TOKEN_SWAP",
      wallet: "FDLUMNmJ5bF5E9ufLm8ENYp5sCJFV8QtNUx6aSBjNScb",
      counterparty: null,
      amountSol: 1.48,
      usdValue: 182_400,
      tokenMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      raw: { source: "sample" },
    },
    explanation: "Large USDC buy on Jupiter — ~$182K swapped in a single transaction.",
    riskFlag: "medium",
    riskReason: "Large swap size",
    createdAt: ago(4),
  },
  {
    id: "sample-new-token",
    userId: "sample",
    ruleId: "sample",
    eventType: "NEW_TOKEN",
    signature: "2Qk9pump7Yk3xZ1mVtdcRr8hLnqWeF4sB6vN3aJ2cD9eP1gH5tU8wX0yZ7iK4oL3mN",
    event: {
      signature: "2Qk9pump7Yk3xZ1mVtdcRr8hLnqWeF4sB6vN3aJ2cD9eP1gH5tU8wX0yZ7iK4oL3mN",
      slot: 423_399_290,
      eventType: "NEW_TOKEN",
      wallet: "6Eö9xpumpQ1mVtdcRr8hLnqWeF4sB6vN3aJ2cD9eP1g",
      counterparty: null,
      amountSol: null,
      usdValue: null,
      tokenMint: "Aa1Bb2Cc3Dd4Ee5Ff6Gg7Hh8Ii9Jj0Kk1Ll2Mm3Nn4Oo",
      raw: { source: "sample" },
    },
    explanation: "Brand-new token minted ~15s ago on pump.fun — verify before trading.",
    riskFlag: "high",
    riskReason: "Newly created token — elevated rug/scam risk",
    createdAt: ago(11),
  },
  {
    id: "sample-sol-transfer",
    userId: "sample",
    ruleId: "sample",
    eventType: "SOL_TRANSFER",
    signature: "3aPnFmBXAJQYM2zzVtdcRr8hLnqWeF4sB6vN3aJ2cD9eP1gH5tU8wX0yZ7iK4oL9xQ",
    event: {
      signature: "3aPnFmBXAJQYM2zzVtdcRr8hLnqWeF4sB6vN3aJ2cD9eP1gH5tU8wX0yZ7iK4oL9xQ",
      slot: 423_399_201,
      eventType: "SOL_TRANSFER",
      wallet: "8QmYdGq2vP4rT6wK1nB3xZ5cV7mL9aJ0sD2fH4gK6tR",
      counterparty: "9RnZeHr3wQ5sU7xL2oC4yA6dW8nM0bK1tE3gI5hL7uS",
      amountSol: 320.5,
      usdValue: 48_200,
      tokenMint: null,
      raw: { source: "sample" },
    },
    explanation: "320 SOL (~$48K) moved between two wallets.",
    riskFlag: "low",
    riskReason: null,
    createdAt: ago(23),
  },
  {
    id: "sample-wallet-activity",
    userId: "sample",
    ruleId: "sample",
    eventType: "WALLET_ACTIVITY",
    signature: "7xKf3pQ9mVtdcRr8hLnqWeF4sB6vN3aJ2cD9eP1gH5tU8wX0yZ7iK4oL3mN2QbVtR1",
    event: {
      signature: "7xKf3pQ9mVtdcRr8hLnqWeF4sB6vN3aJ2cD9eP1gH5tU8wX0yZ7iK4oL3mN2QbVtR1",
      slot: 423_399_120,
      eventType: "WALLET_ACTIVITY",
      wallet: "7xKfPq9MeF4sB6vN3aJ2cD9eP1gH5tU8wX0yZ7iK4oL",
      counterparty: null,
      amountSol: 2.1,
      usdValue: 315,
      tokenMint: null,
      raw: { source: "sample" },
    },
    explanation: "Tracked wallet interacted with a program.",
    riskFlag: "low",
    riskReason: null,
    createdAt: ago(38),
  },
];
