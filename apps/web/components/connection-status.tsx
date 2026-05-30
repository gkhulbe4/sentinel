"use client";

import { cn } from "@/lib/cn";

export type WsStatus = "connecting" | "open" | "closed";

const MAP: Record<WsStatus, { dot: string; label: string; pulse: boolean }> = {
  connecting: { dot: "bg-amber-500", label: "Connecting…", pulse: true },
  open: { dot: "bg-green-500", label: "Live", pulse: true },
  closed: { dot: "bg-red-500", label: "Disconnected", pulse: false },
};

export function ConnectionStatus({ status }: { status: WsStatus }) {
  const { dot, label, pulse } = MAP[status];
  return (
    <span className="inline-flex items-center gap-2 text-xs text-gray-500" aria-live="polite">
      <span className={cn("h-2 w-2 rounded-full", dot, pulse && "animate-pulse")} aria-hidden />
      {label}
    </span>
  );
}
