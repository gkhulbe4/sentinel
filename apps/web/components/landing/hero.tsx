"use client";

import Link from "next/link";
import { motion, type Transition } from "motion/react";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { LANDING_ROUTES } from "@/lib/landing-routes";
import { aleo, hostGrotesk } from "./fonts";

const ease: Transition["ease"] = [0.22, 1, 0.36, 1];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-background">
      {/* orange glow + subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[760px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(closest-side, hsl(22 95% 50% / 0.22), transparent)" }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-[0.4] [background-image:linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />

      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-14 text-center sm:px-6 sm:pb-20 sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
        >
          <Link
            href={LANDING_ROUTES.live}
            className="group inline-flex max-w-[92vw] items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1 pr-1 text-xs font-medium transition-colors duration-200 hover:bg-secondary/60"
          >
            <Sparkles className="size-4 text-primary" />
            <span className="text-foreground">New — on-demand AI risk analysis on every alert</span>
            <span className="hidden items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs text-primary-foreground sm:inline-flex">
              See it
              <ArrowUpRight className="size-3" />
            </span>
          </Link>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease }}
          className="mx-auto mt-6 max-w-5xl text-balance text-4xl font-semibold leading-[120%] tracking-tight text-foreground sm:mt-8 sm:text-5xl md:text-6xl lg:text-7xl"
        >
          <span className={cn("block font-thin", aleo.className)}>Watch Solana in real time.</span>
          <span className={cn("block font-light", hostGrotesk.className)}>Never miss a move.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease }}
          className="mx-auto mt-4 max-w-xl text-pretty text-base text-secondary-foreground sm:mt-5 sm:text-lg"
        >
          Sentinel matches on-chain activity against your watch rules and streams alerts to your
          dashboard the instant they happen — with on-demand AI risk analysis on every hit.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease }}
          className="mt-9 flex items-stretch justify-center gap-2 lg:items-center"
        >
          <Button asChild size="lg">
            <Link href={LANDING_ROUTES.signup}>
              Start watching
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href={LANDING_ROUTES.live}>View live demo</Link>
          </Button>
        </motion.div>
      </div>

      <HeroFeedMock />
    </section>
  );
}

const MOCK_ALERTS = [
  { type: "Token swap", summary: "USDC swap worth $182.4K on Jupiter", risk: "Medium", time: "now", tone: "amber" },
  { type: "New token", summary: "New token Eö9x…7Yk minted 12s ago", risk: "High", time: "3s", tone: "red" },
  { type: "SOL transfer", summary: "SOL transfer worth ~$48.2K", risk: "Low", time: "9s", tone: "blue" },
  { type: "Wallet activity", summary: "Tracked wallet 8Qm…2vP interacted", risk: "Low", time: "21s", tone: "blue" },
] as const;

const TONES: Record<string, string> = {
  red: "bg-red-500/15 text-red-400 border-red-500/25",
  amber: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  blue: "bg-sky-500/15 text-sky-400 border-sky-500/25",
};

function HeroFeedMock() {
  return (
    <div className="relative mx-auto max-w-3xl px-4 pb-16 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease }}
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Live feed
          </div>
          <span className="text-xs text-muted-foreground">streaming · WebSocket</span>
        </div>
        <div className="divide-y divide-border">
          {MOCK_ALERTS.map((a, i) => (
            <div key={a.summary} className={cn("flex items-start gap-3 px-4 py-3 text-left", i === 0 && "animate-alert-in")}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
                    {a.type}
                  </span>
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", TONES[a.tone])}>
                    {a.risk} risk
                  </span>
                </div>
                <p className="mt-1.5 truncate text-sm text-foreground">{a.summary}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{a.time}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
