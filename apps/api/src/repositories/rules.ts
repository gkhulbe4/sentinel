import type { PrismaClient, WatchRule } from "@sentinel/db";
import type { CreateRuleInput, UpdateRuleInput } from "@sentinel/shared";

/** Data access for watch rules. All reads are scoped to the owning user. */
export const rulesRepo = {
  list: (prisma: PrismaClient, userId: string): Promise<WatchRule[]> =>
    prisma.watchRule.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),

  findById: (prisma: PrismaClient, userId: string, id: string): Promise<WatchRule | null> =>
    prisma.watchRule.findFirst({ where: { id, userId } }),

  create: (prisma: PrismaClient, userId: string, data: CreateRuleInput): Promise<WatchRule> =>
    prisma.watchRule.create({
      data: {
        userId,
        eventType: data.eventType,
        walletAddr: data.walletAddr ?? null,
        minUsd: data.minUsd ?? null,
        isActive: data.isActive ?? true,
      },
    }),

  update: (prisma: PrismaClient, id: string, data: UpdateRuleInput): Promise<WatchRule> =>
    prisma.watchRule.update({
      where: { id },
      data: {
        ...(data.eventType !== undefined && { eventType: data.eventType }),
        ...(data.walletAddr !== undefined && { walletAddr: data.walletAddr }),
        ...(data.minUsd !== undefined && { minUsd: data.minUsd }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    }),

  remove: (prisma: PrismaClient, id: string): Promise<WatchRule> =>
    prisma.watchRule.delete({ where: { id } }),
};
