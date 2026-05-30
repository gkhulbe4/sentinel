import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createRuleSchema, updateRuleSchema } from "@sentinel/shared";
import { rulesService } from "../services/rules";

const idParams = z.object({ id: z.string().min(1) });

/** All routes here require a valid Bearer token (scoped preHandler). */
export async function ruleRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", app.authenticate);

  app.get("/rules", async (req) => {
    const rules = await rulesService.list(app, req.user.sub);
    return { rules };
  });

  app.post("/rules", async (req, reply) => {
    const input = createRuleSchema.parse(req.body);
    const rule = await rulesService.create(app, req.user.sub, input);
    void reply.status(201);
    return { rule };
  });

  app.patch("/rules/:id", async (req) => {
    const { id } = idParams.parse(req.params);
    const input = updateRuleSchema.parse(req.body);
    const rule = await rulesService.update(app, req.user.sub, id, input);
    return { rule };
  });

  app.delete("/rules/:id", async (req, reply) => {
    const { id } = idParams.parse(req.params);
    await rulesService.remove(app, req.user.sub, id);
    return reply.status(204).send();
  });
}
