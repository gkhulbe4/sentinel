"use client";

import { ConnectionStatus, type WsStatus } from "@/components/connection-status";

function Radar() {
  return (
    <div className="relative hidden size-32 shrink-0 sm:block" aria-hidden>
      <svg viewBox="0 0 128 128" className="absolute inset-0 text-primary/30">
        <circle cx="64" cy="64" r="61" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="64" cy="64" r="42" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="64" cy="64" r="22" fill="none" stroke="currentColor" strokeWidth="1" />
        <line x1="64" y1="3" x2="64" y2="125" stroke="currentColor" strokeWidth="1" />
        <line x1="3" y1="64" x2="125" y2="64" stroke="currentColor" strokeWidth="1" />
      </svg>
      <div
        className="absolute inset-0 animate-[spin_4s_linear_infinite] rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg 280deg, hsl(22 95% 54% / 0.45) 360deg)",
          WebkitMaskImage: "radial-gradient(circle, black 61%, transparent 62%)",
          maskImage: "radial-gradient(circle, black 61%, transparent 62%)",
        }}
      />
      <span className="absolute left-[32%] top-[36%] size-1.5 rounded-full bg-primary" />
      <span className="absolute left-[68%] top-[58%] size-1.5 animate-ping rounded-full bg-primary/80" />
      <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_12px_2px_hsl(22_95%_54%/0.6)]" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 px-3.5 py-2">
      <div className="text-lg font-semibold leading-none text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export function DashboardBanner({
  status,
  ruleCount,
  alertCount,
}: {
  status: WsStatus;
  ruleCount: number;
  alertCount: number;
}) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/[0.04] to-transparent" />
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
      <div aria-hidden className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative flex items-center justify-between gap-6 p-5 sm:p-6">
        <div className="min-w-0">
          <ConnectionStatus status={status} />
          <h2 className="mt-2 text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Watching Solana in real time
          </h2>
          <p className="mt-1 text-sm text-pretty text-muted-foreground">
            Live alerts the moment your rules match on-chain activity.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Stat label="Watch rules" value={ruleCount} />
            <Stat label="Alerts" value={alertCount} />
          </div>
        </div>
        <Radar />
      </div>
    </div>
  );
}
