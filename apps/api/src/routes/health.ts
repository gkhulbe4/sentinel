import type { FastifyInstance } from "fastify";

/** Liveness/readiness probe: pings Redis and the database. */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async (_req, reply) => {
    const [redisOk, dbOk] = await Promise.all([
      app.redis
        .ping()
        .then(() => true)
        .catch(() => false),
      app.prisma
        .$queryRaw`SELECT 1`.then(() => true)
        .catch(() => false),
    ]);
    const ok = redisOk && dbOk;
    if (!ok) void reply.status(503);
    return {
      status: ok ? "ok" : "degraded",
      redis: redisOk ? "up" : "down",
      db: dbOk ? "up" : "down",
      uptime: Math.round(process.uptime()),
    };
  });
}
