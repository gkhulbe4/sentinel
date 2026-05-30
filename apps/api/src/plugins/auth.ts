import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import type { FastifyRequest } from "fastify";
import { httpError } from "../lib/errors";

const TOKEN_TTL = "7d";

export interface TokenPayload {
  sub: string;
  email: string;
}

/**
 * Registers @fastify/jwt (HS256 with the shared `JWT_SECRET`) and exposes:
 * - `app.signToken(payload)` to mint a token (used by the auth routes),
 * - `app.authenticate` preHandler that verifies the Bearer token or 401s.
 */
export const authPlugin = fp(
  async (app) => {
    await app.register(jwt, {
      secret: app.env.JWT_SECRET,
      sign: { expiresIn: TOKEN_TTL },
    });

    app.decorate("signToken", (payload: TokenPayload): string => app.jwt.sign(payload));

    app.decorate("authenticate", async (req: FastifyRequest): Promise<void> => {
      try {
        await req.jwtVerify();
      } catch {
        throw httpError.unauthorized("Missing or invalid token");
      }
    });
  },
  { name: "auth" },
);

declare module "fastify" {
  interface FastifyInstance {
    signToken: (payload: TokenPayload) => string;
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: TokenPayload;
    user: TokenPayload;
  }
}
