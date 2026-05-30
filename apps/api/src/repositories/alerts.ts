import type { PrismaClient } from "@sentinel/db";
import type { Alert, EventType, OnChainEvent, RiskFlag } from "@sentinel/shared";

export interface AlertPage {
  alerts: Alert[];
  nextCursor: string | null;
}

/** Cursor-paginated alert history for a user, newest first. */
export const alertsRepo = {
  async listForUser(
    prisma: PrismaClient,
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<AlertPage> {
    const rows = await prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    const alerts: Alert[] = page.map((r) => ({
      id: r.id,
      userId: r.userId,
      ruleId: r.ruleId,
      eventType: r.eventType as EventType,
      signature: r.signature,
      event: r.payload as unknown as OnChainEvent,
      explanation: r.explanation,
      riskFlag: r.riskFlag as RiskFlag | null,
      riskReason: r.riskReason,
      createdAt: r.createdAt.toISOString(),
    }));

    return { alerts, nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null };
  },
};
