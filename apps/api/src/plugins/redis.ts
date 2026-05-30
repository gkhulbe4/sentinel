import fp from "fastify-plugin";
import Redis from "ioredis";

/** Decorates the app with a reconnecting ioredis client (`app.redis`). */
export const redisPlugin = fp(
  (app, _opts, done) => {
    const redis = new Redis(app.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });
    redis.on("error", (err) => app.log.error({ err }, "redis error"));
    redis.on("connect", () => app.log.info("redis connected"));

    app.decorate("redis", redis);
    app.addHook("onClose", async () => {
      await redis.quit();
    });
    done();
  },
  { name: "redis" },
);

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}
