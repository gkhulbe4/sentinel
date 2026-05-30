import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

/** A typed, client-safe error. The handler renders it as `{ error: { code, message } }`. */
export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const httpError = {
  badRequest: (message: string, code = "BAD_REQUEST") => new AppError(400, code, message),
  unauthorized: (message = "Unauthorized", code = "UNAUTHORIZED") =>
    new AppError(401, code, message),
  forbidden: (message = "Forbidden", code = "FORBIDDEN") => new AppError(403, code, message),
  notFound: (message = "Not found", code = "NOT_FOUND") => new AppError(404, code, message),
  conflict: (message: string, code = "CONFLICT") => new AppError(409, code, message),
};

interface MaybeFastifyError extends Error {
  statusCode?: number;
  code?: string;
  validation?: unknown;
}

/** Central error + not-found handlers with a single JSON error shape. */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setNotFoundHandler((req: FastifyRequest, reply: FastifyReply) => {
    void reply.status(404).send({
      error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.url} not found` },
    });
  });

  app.setErrorHandler((error: MaybeFastifyError, req: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof AppError) {
      void reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message },
      });
      return;
    }

    if (error instanceof ZodError) {
      const message = error.issues
        .map((i) => `${i.path.join(".") || "(body)"}: ${i.message}`)
        .join("; ");
      void reply.status(400).send({ error: { code: "VALIDATION", message } });
      return;
    }

    if (error.validation) {
      void reply.status(400).send({ error: { code: "VALIDATION", message: error.message } });
      return;
    }

    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) {
      req.log.error({ err: error }, "unhandled error");
    }
    const isServer = statusCode >= 500;
    const message =
      isServer && app.env.NODE_ENV === "production" ? "Internal server error" : error.message;
    void reply.status(statusCode).send({
      error: { code: isServer ? "INTERNAL" : (error.code ?? "ERROR"), message },
    });
  });
}
