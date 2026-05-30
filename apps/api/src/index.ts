// Placeholder entrypoint. Phase 2 builds the real service here:
// Fastify (HTTP) + `ws` (WebSocket), Zod-validated env, pino logging,
// /health, central error handler, CORS, graceful shutdown, Prisma + ioredis.

function main(): void {
  console.log("[api] placeholder running — Fastify + ws server arrives in Phase 2");
}

main();

// Keep the process alive so `turbo run dev` shows the service as running.
// Replaced by `fastify.listen(...)` in Phase 2.
setInterval(() => void 0, 60_000);
