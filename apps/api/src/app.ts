import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import type { Env } from "./env";
import { redisPlugin } from "./plugins/redis";
import { prismaPlugin } from "./plugins/prisma";
import { authPlugin } from "./plugins/auth";
import { websocketPlugin } from "./plugins/websocket";
import { AppError, registerErrorHandler } from "./lib/errors";
import { healthRoutes } from "./routes/health";
import { authRoutes } from "./routes/auth";
import { ruleRoutes } from "./routes/rules";
import { alertRoutes } from "./routes/alerts";

/** Build a fully-wired Fastify instance (no `listen`). */
export async function buildServer(env: Env): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === "development" ? { target: "pino-pretty", options: { colorize: true } } : undefined,
    },
    trustProxy: true,
  });

  app.decorate("env", env);

  await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
  await app.register(redisPlugin);
  await app.register(prismaPlugin);
  await app.register(authPlugin);

  // Distributed rate limiting backed by Redis (per-IP), excluding /health.
  await app.register(rateLimit, {
    redis: app.redis,
    max: 120,
    timeWindow: "1 minute",
    allowList: (req) => req.url === "/health",
    // @fastify/rate-limit throws the builder's result; returning an AppError lets
    // the central handler render it as a 429 with our standard error shape.
    errorResponseBuilder: (_req, context) =>
      new AppError(
        429,
        "RATE_LIMITED",
        `Too many requests. Retry in ${Math.ceil(context.ttl / 1000)}s.`,
      ),
  });

  await app.register(websocketPlugin);

  registerErrorHandler(app);

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(ruleRoutes);
  await app.register(alertRoutes);

  return app;
}

declare module "fastify" {
  interface FastifyInstance {
    env: Env;
  }
}
