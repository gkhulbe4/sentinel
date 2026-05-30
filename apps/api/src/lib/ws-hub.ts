import type { FastifyBaseLogger } from "fastify";
import type Redis from "ioredis";
import { WebSocket } from "ws";
import { CHANNEL_ALERTS_PREFIX, channelAlerts } from "@sentinel/shared";

/**
 * Routes Redis `alerts:{userId}` messages to local sockets. Uses a single
 * subscriber connection and dynamically (un)subscribes per user so a process
 * only receives traffic for users it actually serves.
 */
export class WsHub {
  private readonly byUser = new Map<string, Set<WebSocket>>();

  constructor(
    private readonly sub: Redis,
    private readonly log: FastifyBaseLogger,
  ) {
    this.sub.on("message", (channel: string, message: string) => {
      this.route(channel, message);
    });
  }

  async add(userId: string, ws: WebSocket): Promise<void> {
    let set = this.byUser.get(userId);
    if (!set) {
      set = new Set();
      this.byUser.set(userId, set);
      await this.sub.subscribe(channelAlerts(userId));
    }
    set.add(ws);
  }

  async remove(userId: string, ws: WebSocket): Promise<void> {
    const set = this.byUser.get(userId);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) {
      this.byUser.delete(userId);
      await this.sub.unsubscribe(channelAlerts(userId)).catch((err: unknown) => {
        this.log.error({ err, userId }, "ws unsubscribe failed");
      });
    }
  }

  /** Forward a raw Redis message verbatim to every open socket for that user. */
  private route(channel: string, message: string): void {
    if (!channel.startsWith(CHANNEL_ALERTS_PREFIX)) return;
    const userId = channel.slice(CHANNEL_ALERTS_PREFIX.length);
    const set = this.byUser.get(userId);
    if (!set) return;
    for (const ws of set) {
      if (ws.readyState === WebSocket.OPEN) ws.send(message);
    }
  }
}
