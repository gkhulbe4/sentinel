import { type Enrichment, type OnChainEvent, type RiskFlag, enrichmentSchema } from "@sentinel/shared";

/**
 * On-demand AI analysis of a matched event. Tries OpenAI Structured Outputs when
 * a key is configured; otherwise (or on any failure) falls back to a deterministic
 * local heuristic so the feature works without a key. Mirrors the schema the web
 * validates with (`enrichmentSchema`).
 */

const SYSTEM_PROMPT =
  "You are a terse on-chain analyst. Given a normalized Solana event as JSON, " +
  "explain it in one plain sentence (<=140 chars) and assign a risk flag. A " +
  "brand-new token combined with a large buy is high risk.";

const MAX_EXPLANATION = 140;
const LARGE_USD = 100_000;

export interface OpenAIConfig {
  apiKey?: string;
  model: string;
  baseUrl: string;
}

export async function enrichEvent(event: OnChainEvent, cfg: OpenAIConfig): Promise<Enrichment> {
  const ai = await openaiEnrich(event, cfg).catch(() => null);
  return ai ?? heuristic(event);
}

/** Call OpenAI Chat Completions with a strict JSON schema. Returns null on no-key/any error. */
async function openaiEnrich(event: OnChainEvent, cfg: OpenAIConfig): Promise<Enrichment | null> {
  if (!cfg.apiKey) return null;

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["explanation", "riskFlag", "riskReason"],
    properties: {
      explanation: { type: "string" },
      riskFlag: { type: "string", enum: ["none", "low", "medium", "high"] },
      riskReason: { type: ["string", "null"] },
    },
  };

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(event) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "enrichment", strict: true, schema },
      },
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;
  const parsed = enrichmentSchema.safeParse(JSON.parse(content));
  return parsed.success ? parsed.data : null;
}

/** Deterministic local analysis so the feature works without an API key. */
function heuristic(event: OnChainEvent): Enrichment {
  const usd = event.usdValue ?? 0;
  const raw = (event.raw ?? {}) as { dex?: string; symbol?: string; ageSeconds?: number };

  let explanation: string;
  let riskFlag: RiskFlag;
  let riskReason: string | null;

  switch (event.eventType) {
    case "NEW_TOKEN": {
      const age = raw.ageSeconds;
      explanation =
        age != null && age < 60
          ? `Brand-new token minted ${age}s ago — verify before trading`
          : "New token launch detected on-chain";
      riskFlag = "high";
      riskReason = "Newly created token — elevated rug/scam risk";
      break;
    }
    case "TOKEN_SWAP": {
      const dex = raw.dex ?? "a DEX";
      const symbol = raw.symbol ?? "token";
      explanation = `${symbol} swap worth ${fmtUsd(usd)} on ${dex}`;
      if (usd >= LARGE_USD) {
        riskFlag = "medium";
        riskReason = "Large swap size";
      } else {
        riskFlag = "low";
        riskReason = null;
      }
      break;
    }
    case "SOL_TRANSFER": {
      explanation = `SOL transfer worth ~${fmtUsd(usd)}`;
      if (usd >= LARGE_USD) {
        riskFlag = "medium";
        riskReason = "Large transfer";
      } else {
        riskFlag = "none";
        riskReason = null;
      }
      break;
    }
    default: {
      explanation = "Tracked wallet interaction";
      riskFlag = "low";
      riskReason = null;
    }
  }

  return { explanation: truncate(explanation, MAX_EXPLANATION), riskFlag, riskReason };
}

function fmtUsd(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(1)}K`;
  return `$${usd.toFixed(0)}`;
}

function truncate(s: string, max: number): string {
  return [...s].length <= max ? s : `${[...s].slice(0, max - 1).join("")}…`;
}
