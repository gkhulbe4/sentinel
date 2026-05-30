import fp from "fastify-plugin";
import { type PrismaClient, prisma } from "@sentinel/db";

/** Decorates the app with the shared PrismaClient (`app.prisma`). */
export const prismaPlugin = fp(
  async (app) => {
    await prisma.$connect();
    app.decorate("prisma", prisma);
    app.addHook("onClose", async () => {
      await prisma.$disconnect();
    });
  },
  { name: "prisma" },
);

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
