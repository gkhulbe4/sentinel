import type { FastifyInstance } from "fastify";
import { credentialsSchema, signupSchema } from "@sentinel/shared";
import * as authService from "../services/auth";
import { httpError } from "../lib/errors";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/signup", async (req, reply) => {
    const { email, password, name } = signupSchema.parse(req.body);
    const user = await authService.signup(app.prisma, email, password, name);
    const token = app.signToken({ sub: user.id, email: user.email });
    void reply.status(201);
    return { token, user };
  });

  app.post("/auth/login", async (req) => {
    const { email, password } = credentialsSchema.parse(req.body);
    const user = await authService.login(app.prisma, email, password);
    const token = app.signToken({ sub: user.id, email: user.email });
    return { token, user };
  });

  app.get("/auth/me", { preHandler: [app.authenticate] }, async (req) => {
    const user = await app.prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { id: true, email: true, createdAt: true },
    });
    if (!user) throw httpError.unauthorized();
    return { user };
  });
}
