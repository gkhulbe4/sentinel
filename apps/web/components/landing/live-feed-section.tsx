"use client";

import { motion, type Transition } from "motion/react";
import { Check, Sparkles } from "lucide-react";
import { SectionFrame } from "./section-frame";
import { SectionHeader } from "./section-header";
import { cn } from "@/lib/cn";
import { aleo, hostGrotesk } from "./fonts";

const ease: Transition["ease"] = [0.22, 1, 0.36, 1];

const POINTS = [
  "Alerts arrive over WebSocket in well under a second on matching activity.",
  "A virtualized feed stays smooth even with thousands of alerts loaded.",
  "Open any alert for AI risk + a plain-English explanation — cached after the first look.",
];

export function LiveFeedSection() {
  return (
    <section className="relative bg-background">
      <SectionFrame className="px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        <SectionHeader
          title={
            <span className={cn("font-thin", aleo.className)}>
              Your feed, the moment it{" "}
              <span className={cn("font-light", hostGrotesk.className)}>happens</span>
            </span>
          }
          description="Every match lands in the live feed instantly. Click into one and Sentinel pulls AI context on demand."
        />
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <ul className="space-y-4">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Check className="size-3.5" />
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">{p}</span>
              </li>
            ))}
          </ul>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease }}
            className="rounded-2xl border border-border bg-card p-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)]"
          >
            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
                  New token
                </span>
                <span className="text-xs text-muted-foreground">2s ago</span>
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">New token Eö9x…7Yk minted 12s ago</p>
              <p className="mt-1 text-xs text-muted-foreground">pump.fun · initial liquidity 14.2 SOL</p>

              <div className="mt-4 rounded-lg border border-border p-3">
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Sparkles className="size-4 text-primary" />
                  AI analysis
                </div>
                <div className="mt-2 inline-flex rounded-full border border-red-500/25 bg-red-500/15 px-2 py-0.5 text-[11px] font-medium text-red-400">
                  High risk
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  Brand-new token minted seconds ago — verify the mint and liquidity before trading.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Newly created token — elevated rug/scam risk.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </SectionFrame>
    </section>
  );
}
