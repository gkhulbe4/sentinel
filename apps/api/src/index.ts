import { loadEnv } from "./env";
import { buildServer } from "./app";

async function main(): Promise<void> {
  const env = loadEnv();
  const app = await buildServer(env);

  const shutdown = (signal: NodeJS.Signals): void => {
    app.log.info({ signal }, "shutting down");
    void app.close().then(() => {
      process.exit(0);
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();
