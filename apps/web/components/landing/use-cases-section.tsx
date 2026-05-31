"use client";

import { motion, type Variants } from "motion/react";
import { Boxes, Briefcase, ShieldAlert, TrendingUp } from "lucide-react";
import { SectionShell } from "./section-shell";
import { cn } from "@/lib/cn";
import { aleo, hostGrotesk } from "./fonts";

const ease = [0.22, 1, 0.36, 1] as const;
const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } };

const CASES = [
  {
    icon: TrendingUp,
    title: "Traders",
    body: "Catch large swaps, fresh token launches, and whale moves the second they hit — before they trend.",
  },
  {
    icon: Boxes,
    title: "Protocol teams",
    body: "Monitor your program's wallets and key counterparties for unusual or large on-chain activity.",
  },
  {
    icon: ShieldAlert,
    title: "Security & monitoring",
    body: "Flag suspicious transfers and brand-new tokens with on-demand AI risk scoring.",
  },
  {
    icon: Briefcase,
    title: "Funds & desks",
    body: "Track positions and counterparties across many wallets in a single real-time feed.",
  },
];

export function UseCasesSection() {
  return (
    <SectionShell
      title={
        <span className={cn("font-thin", aleo.className)}>
          Built for everyone watching{" "}
          <span className={cn("font-light", hostGrotesk.className)}>Solana</span>
        </span>
      }
      subtitle="One live feed, many jobs. Point Sentinel at the activity you care about."
    >
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={container}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {CASES.map((c) => (
          <motion.div
            key={c.title}
            variants={item}
            className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
          >
            <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-secondary text-primary">
              <c.icon className="size-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">{c.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
          </motion.div>
        ))}
      </motion.div>
    </SectionShell>
  );
}
