// Zod schemas: runtime validation at every boundary (Redis payloads, API
// bodies, WS messages). Shapes mirror the ts-rs-generated types so the static
// and runtime contracts stay in lockstep.

import { z } from "zod";

export const eventTypeSchema = z.enum([
  "SOL_TRANSFER",
  "TOKEN_SWAP",
  "NEW_TOKEN",
  "WALLET_ACTIVITY",
]);

export const riskFlagSchema = z.enum(["none", "low", "medium", "high"]);

export const onChainEventSchema = z.object({
  signature: z.string(),
  slot: z.number(),
  eventType: eventTypeSchema,
  wallet: z.string(),
  counterparty: z.string().nullable(),
  amountSol: z.number().nullable(),
  usdValue: z.number().nullable(),
  tokenMint: z.string().nullable(),
  raw: z.unknown(),
});

export const enrichmentSchema = z.object({
  explanation: z.string(),
  riskFlag: riskFlagSchema,
  riskReason: z.string().nullable(),
});

export const alertSchema = z.object({
  id: z.string(),
  userId: z.string(),
  ruleId: z.string(),
  eventType: eventTypeSchema,
  signature: z.string(),
  event: onChainEventSchema,
  explanation: z.string().nullable(),
  riskFlag: riskFlagSchema.nullable(),
  riskReason: z.string().nullable(),
  createdAt: z.string(),
});

export const alertEnrichedPatchSchema = z.object({
  id: z.string(),
  explanation: z.string(),
  riskFlag: riskFlagSchema,
  riskReason: z.string().nullable(),
});

export const serverMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("alert"), data: alertSchema }),
  z.object({ type: z.literal("enriched"), data: alertEnrichedPatchSchema }),
]);

// --- Auth (shared by web Auth.js + api JWT verification) ---

export const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

// --- Watch-rule API inputs ---

export const createRuleSchema = z.object({
  eventType: eventTypeSchema,
  walletAddr: z.string().trim().min(1).max(64).optional(),
  minUsd: z.number().positive().max(1_000_000_000).optional(),
  isActive: z.boolean().optional(),
});

export const updateRuleSchema = createRuleSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: "At least one field is required" },
);

export type Credentials = z.infer<typeof credentialsSchema>;
export type CreateRuleInput = z.infer<typeof createRuleSchema>;
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;
