"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { type Alert, serverMessageSchema } from "@sentinel/shared";
import { WS_URL } from "@/lib/config";
import type { WsStatus } from "@/components/connection-status";

const MAX_ALERTS = 1000;
const MAX_BACKOFF_MS = 15_000;

/**
 * Subscribes to the live alert stream over WebSocket. New alerts are prepended;
 * `enriched` patches update the matching alert in place. Auto-reconnects with
 * exponential backoff.
 */
export function useLiveAlerts(): { alerts: Alert[]; status: WsStatus; clear: () => void } {
  const { data: session } = useSession();
  const token = session?.apiToken;
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [status, setStatus] = useState<WsStatus>("connecting");

  useEffect(() => {
    if (!token) return;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let retries = 0;
    let disposed = false;

    const connect = (): void => {
      setStatus("connecting");
      ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);

      ws.onopen = () => {
        retries = 0;
        setStatus("open");
      };

      ws.onmessage = (ev) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(ev.data as string);
        } catch {
          return;
        }
        const result = serverMessageSchema.safeParse(parsed);
        if (!result.success) return; // ignores the {type:"connected"} hello
        const msg = result.data;
        if (msg.type === "alert") {
          // Zod-validated; assert to the shared Alert (raw optionality quirk).
          setAlerts((prev) => [msg.data as Alert, ...prev].slice(0, MAX_ALERTS));
        } else {
          setAlerts((prev) =>
            prev.map((a) =>
              a.id === msg.data.id
                ? {
                    ...a,
                    explanation: msg.data.explanation,
                    riskFlag: msg.data.riskFlag,
                    riskReason: msg.data.riskReason,
                  }
                : a,
            ),
          );
        }
      };

      ws.onclose = () => {
        setStatus("closed");
        if (disposed) return;
        const delay = Math.min(1000 * 2 ** retries, MAX_BACKOFF_MS);
        retries += 1;
        reconnectTimer = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();
    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [token]);

  const clear = useCallback(() => {
    setAlerts([]);
  }, []);

  return { alerts, status, clear };
}
