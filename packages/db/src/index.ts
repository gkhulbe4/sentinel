import { PrismaClient } from "@prisma/client";

// Re-export Prisma's generated types so the API imports models from one place.
export * from "@prisma/client";
export { PrismaClient } from "@prisma/client";

/**
 * A single PrismaClient per process. In dev, Next/tsx hot-reload would
 * otherwise create a new client (and connection pool) on every reload, so we
 * cache it on `globalThis`.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
