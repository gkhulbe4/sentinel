import type { IncomingMessage } from "node:http";
import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { WebSocket, WebSocketServer } from "ws";
import { WsHub } from "../lib/ws-hub";

const HEARTBEAT_MS = 30_000;

type AppSocket = WebSocket & { isAlive?: boolean };

/**
 * WebSocket fan-out on `/ws`. Authenticates the JWT during the upgrade
 * handshake (token in the query string), then streams that user's alerts.
 */
export const websocketPlugin = fp(
  (app, _opts, done) => {
    const sub = app.redis.duplicate();
    const hub = new WsHub(sub, app.log);
    const wss = new WebSocketServer({ noServer: true });

    app.server.on("upgrade", (req, socket, head) => {
      if (!req.url || !req.url.startsWith("/ws")) {
        socket.destroy();
        return;
      }
      const userId = authenticateUpgrade(app, req);
      if (!userId) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }
      wss.handleUpgrade(req, socket, head, (ws) => {
        setupConnection(app, hub, ws as AppSocket, userId);
      });
    });

    const heartbeat = setInterval(() => {
      for (const client of wss.clients) {
        const ws = client as AppSocket;
        if (ws.isAlive === false) {
          ws.terminate();
          continue;
        }
        ws.isAlive = false;
        ws.ping();
      }
    }, HEARTBEAT_MS);

    app.addHook("onClose", async () => {
      clearInterval(heartbeat);
      for (const client of wss.clients) client.terminate();
      wss.close();
      await sub.quit();
    });

    done();
  },
  { name: "websocket", dependencies: ["redis", "auth"] },
);

function setupConnection(
  app: FastifyInstance,
  hub: WsHub,
  ws: AppSocket,
  userId: string,
): void {
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });
  void hub.add(userId, ws).catch((err: unknown) => {
    app.log.error({ err, userId }, "ws subscribe failed");
  });
  const cleanup = (): void => {
    void hub.remove(userId, ws);
  };
  ws.on("close", cleanup);
  ws.on("error", cleanup);
  ws.send(JSON.stringify({ type: "connected" }));
}

function authenticateUpgrade(app: FastifyInstance, req: IncomingMessage): string | null {
  try {
    const url = new URL(req.url ?? "", "http://localhost");
    const token = url.searchParams.get("token");
    if (!token) return null;
    const payload = app.jwt.verify<{ sub: string }>(token);
    return payload.sub;
  } catch {
    return null;
  }
}
