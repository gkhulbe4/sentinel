import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { alertsRepo } from "../repositories/alerts";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export async function alertRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", app.authenticate);

  app.get("/alerts", async (req) => {
    const { limit, cursor } = querySchema.parse(req.query);
    return alertsRepo.listForUser(app.prisma, req.user.sub, limit, cursor);
  });
}
