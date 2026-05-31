import type { FastifyInstance } from "fastify";
import { CHANNEL_EVENTS } from "@sentinel/shared";
import { type HeliusTxn, normalizeHeliusTxns } from "../services/helius";
import { getSolPriceUsd } from "../services/sol-price";
import { httpError } from "../lib/errors";

/**
 * Public ingress for real on-chain events. Helius "Enhanced" webhooks POST an
 * array of decoded transactions here; we normalize them to `OnChainEvent`s and
 * publish to the Redis `events` channel — the same channel the mock ingestor
 * uses — so the matcher pipeline is identical for mock and real data.
 *
 * Not behind JWT auth (Helius calls it, not a user). If HELIUS_WEBHOOK_AUTH is
 * set, the request must send it as the `Authorization` header.
 */
export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  app.post("/webhooks/helius", async (req, reply) => {
    const expected = app.env.HELIUS_WEBHOOK_AUTH;
    if (expected && req.headers.authorization !== expected) {
      throw httpError.unauthorized("Invalid webhook auth");
    }

    // Helius sends a bare JSON array; tolerate a { transactions: [...] } wrapper too.
    const body = req.body as unknown;
    const txns: HeliusTxn[] = Array.isArray(body)
      ? (body as HeliusTxn[])
      : ((body as { transactions?: HeliusTxn[] })?.transactions ?? []);

    if (txns.length === 0) {
      return { ok: true, received: 0, published: 0 };
    }

    const solPriceUsd = await getSolPriceUsd();
    const events = normalizeHeliusTxns(txns, solPriceUsd);

    await Promise.all(events.map((e) => app.redis.publish(CHANNEL_EVENTS, JSON.stringify(e))));

    req.log.info({ received: txns.length, published: events.length }, "helius webhook ingested");
    void reply.status(200);
    return { ok: true, received: txns.length, published: events.length };
  });
}
