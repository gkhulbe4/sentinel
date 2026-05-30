import type { FastifyInstance } from "fastify";
import type { WatchRule } from "@sentinel/db";
import { type CreateRuleInput, type UpdateRuleInput, channelRulesChanged } from "@sentinel/shared";
import { rulesRepo } from "../repositories/rules";
import { httpError } from "../lib/errors";

/**
 * Tell the matcher to refresh its in-memory rule cache for this user. Best
 * effort — a publish failure must not fail the user's CRUD request.
 */
async function notifyRulesChanged(app: FastifyInstance, userId: string): Promise<void> {
  try {
    await app.redis.publish(channelRulesChanged(userId), userId);
  } catch (err) {
    app.log.error({ err, userId }, "failed to publish rules:changed");
  }
}

export const rulesService = {
  list: (app: FastifyInstance, userId: string): Promise<WatchRule[]> =>
    rulesRepo.list(app.prisma, userId),

  async create(app: FastifyInstance, userId: string, input: CreateRuleInput): Promise<WatchRule> {
    const rule = await rulesRepo.create(app.prisma, userId, input);
    await notifyRulesChanged(app, userId);
    return rule;
  },

  async update(
    app: FastifyInstance,
    userId: string,
    id: string,
    input: UpdateRuleInput,
  ): Promise<WatchRule> {
    const existing = await rulesRepo.findById(app.prisma, userId, id);
    if (!existing) throw httpError.notFound("Rule not found");
    const rule = await rulesRepo.update(app.prisma, id, input);
    await notifyRulesChanged(app, userId);
    return rule;
  },

  async remove(app: FastifyInstance, userId: string, id: string): Promise<void> {
    const existing = await rulesRepo.findById(app.prisma, userId, id);
    if (!existing) throw httpError.notFound("Rule not found");
    await rulesRepo.remove(app.prisma, id);
    await notifyRulesChanged(app, userId);
  },
};
