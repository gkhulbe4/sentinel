import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Enrichment, OnChainEvent, RiskFlag } from "@sentinel/shared";
import { alertsRepo } from "../repositories/alerts";
import { enrichEvent } from "../services/enrichment";
import { httpError } from "../lib/errors";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

const idParams = z.object({ id: z.string().min(1) });

export async function alertRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", app.authenticate);

  app.get("/alerts", async (req) => {
    const { limit, cursor } = querySchema.parse(req.query);
    return alertsRepo.listForUser(app.prisma, req.user.sub, limit, cursor);
  });

  // On-demand AI analysis for one alert. Cached after the first call: re-opening
  // returns the stored enrichment without another model call.
  app.post("/alerts/:id/enrich", async (req): Promise<Enrichment> => {
    const { id } = idParams.parse(req.params);
    const alert = await alertsRepo.findById(app.prisma, id);
    if (!alert || alert.userId !== req.user.sub) {
      throw httpError.notFound("Alert not found");
    }

    if (alert.explanation && alert.riskFlag) {
      return {
        explanation: alert.explanation,
        riskFlag: alert.riskFlag as RiskFlag,
        riskReason: alert.riskReason,
      };
    }

    const enrichment = await enrichEvent(alert.payload as unknown as OnChainEvent, {
      apiKey: app.env.OPENAI_API_KEY,
      model: app.env.OPENAI_MODEL,
      baseUrl: app.env.OPENAI_BASE_URL,
    });
    await alertsRepo.saveEnrichment(app.prisma, id, enrichment);
    return enrichment;
  });
}
