import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import type { Env } from "./env";
import { redisPlugin } from "./plugins/redis";
import { prismaPlugin } from "./plugins/prisma";
import { authPlugin } from "./plugins/auth";
import { registerErrorHandler } from "./lib/errors";
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
