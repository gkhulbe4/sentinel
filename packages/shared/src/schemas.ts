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
  // `z.custom<unknown>()` keeps `raw` a required `unknown` key so the inferred
  // type matches the ts-rs-generated OnChainEvent exactly.
  raw: z.custom<unknown>(() => true),
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

/** Signup adds a display name to the login credentials. */
export const signupSchema = credentialsSchema.extend({
  name: z.string().trim().min(1, "Enter your name").max(80),
});
export type SignupInput = z.infer<typeof signupSchema>;

// --- Watch-rule API inputs ---

const ruleFields = z.object({
  eventType: eventTypeSchema,
  walletAddr: z.string().trim().min(32).max(64).optional(),
  minUsd: z.number().positive().max(1_000_000_000).optional(),
  isActive: z.boolean().optional(),
});

const requireWalletForActivity = (v: { eventType: string; walletAddr?: string }): boolean =>
  v.eventType !== "WALLET_ACTIVITY" || Boolean(v.walletAddr);

export const createRuleSchema = ruleFields.refine(requireWalletForActivity, {
  message: "walletAddr is required for WALLET_ACTIVITY rules",
  path: ["walletAddr"],
});

export const updateRuleSchema = ruleFields
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required" });

/** Watch rule as returned by the API (includes server-managed fields). */
export const ruleDtoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  eventType: eventTypeSchema,
  walletAddr: z.string().nullable(),
  minUsd: z.number().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export type Credentials = z.infer<typeof credentialsSchema>;
export type CreateRuleInput = z.infer<typeof createRuleSchema>;
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;
export type RuleDto = z.infer<typeof ruleDtoSchema>;
