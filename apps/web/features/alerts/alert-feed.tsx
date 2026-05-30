"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Alert } from "@sentinel/shared";
import { AlertCard } from "./alert-card";

/**
 * Virtualized alert feed — stays smooth with thousands of alerts loaded.
 * Keys by alert id so enrichment patches update the right row on prepend.
 */
export function AlertFeed({ alerts }: { alerts: Alert[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: alerts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    overscan: 8,
    getItemKey: (index) => alerts[index]?.id ?? index,
  });

  return (
    <div
      ref={parentRef}
      role="log"
      aria-live="polite"
      aria-label="Live alerts"
      className="h-[calc(100vh-260px)] min-h-80 overflow-auto rounded-xl border border-gray-200 dark:border-gray-800"
    >
      <div style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}>
        {virtualizer.getVirtualItems().map((item) => {
          const alert = alerts[item.index];
          if (!alert) return null;
          return (
            <div
              key={item.key}
              ref={virtualizer.measureElement}
              data-index={item.index}
              className="absolute left-0 top-0 w-full p-2"
              style={{ transform: `translateY(${item.start}px)` }}
            >
              <AlertCard alert={alert} animate={item.index === 0} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
