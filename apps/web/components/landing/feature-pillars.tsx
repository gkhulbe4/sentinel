"use client";

import { motion, type Variants } from "motion/react";
import { Filter, Sparkles, Zap } from "lucide-react";
import { SectionFrame } from "./section-frame";
import { SectionHeader } from "./section-header";
import { cn } from "@/lib/cn";
import { aleo, hostGrotesk } from "./fonts";

const ease = [0.22, 1, 0.36, 1] as const;
const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.04 } } };
const item: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } };

const PILLARS = [
  {
    icon: Filter,
    primary: "Rule-based matching",
    secondary: "watch exactly what matters.",
    body: "Token swaps, SOL transfers, new tokens, or a specific wallet — set a USD threshold and Sentinel matches every event against your active rules in memory.",
  },
  {
    icon: Zap,
    primary: "Real-time alerts",
    secondary: "sub-second, every time.",
    body: "Matches stream to your dashboard over WebSocket the instant they happen — a virtualized feed that stays smooth at thousands of alerts.",
  },
  {
    icon: Sparkles,
    primary: "On-demand AI analysis",
    secondary: "context when you want it.",
    body: "Open any alert for a one-line explanation and a risk flag from gpt-4o-mini — computed on demand and cached, so you only spend on what you read.",
  },
];

export function FeaturePillars() {
  return (
    <section className="relative bg-background">
      <SectionFrame className="px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        <SectionHeader
          title={
            <span className={cn("font-thin", aleo.className)}>
              Everything you need to{" "}
              <span className={cn("font-light", hostGrotesk.className)}>watch the chain</span>
            </span>
          }
          description="Define rules, get alerts the moment they match, and pull AI context on demand."
        />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.3 }}
          variants={container}
          className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3"
        >
          {PILLARS.map((p) => (
            <motion.div
              key={p.primary}
              variants={item}
              className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-secondary text-primary">
                <p.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                {p.primary}
                <span className="block font-normal text-muted-foreground">{p.secondary}</span>
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </SectionFrame>
    </section>
  );
}
