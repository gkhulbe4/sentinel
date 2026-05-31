"use client";

import { motion, type Variants } from "motion/react";
import { SectionFrame } from "./section-frame";
import { SectionHeader } from "./section-header";
import { cn } from "@/lib/cn";
import { aleo, hostGrotesk } from "./fonts";

const ease = [0.22, 1, 0.36, 1] as const;
const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } };

const STEPS = [
  { n: "01", title: "Create a watch rule", body: "Pick an event type, optionally pin a wallet, and set a USD threshold." },
  { n: "02", title: "Sentinel watches the chain", body: "A Rust matcher checks every on-chain event against your active rules in memory." },
  { n: "03", title: "Get instant alerts", body: "Matches stream to your dashboard over WebSocket the moment they happen." },
  { n: "04", title: "Open for AI analysis", body: "Pull a risk flag and a plain-English explanation on demand, cached after." },
];

export function HowItWorksSection() {
  return (
    <section className="relative bg-background">
      <SectionFrame className="px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        <SectionHeader
          title={
            <span className={cn("font-thin", aleo.className)}>
              From rule to alert in{" "}
              <span className={cn("font-light", hostGrotesk.className)}>four steps</span>
            </span>
          }
          description="No infrastructure to run. Sign up, add a rule, and the alerts start flowing."
        />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={container}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {STEPS.map((s) => (
            <motion.div
              key={s.n}
              variants={item}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="font-mono text-sm font-semibold text-primary">{s.n}</div>
              <h3 className="mt-3 text-base font-semibold tracking-tight text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </SectionFrame>
    </section>
  );
}
