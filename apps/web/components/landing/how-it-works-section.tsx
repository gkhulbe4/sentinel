"use client";

import { motion, type Variants } from "motion/react";
import { Bell, Filter, Radar, Sparkles } from "lucide-react";
import { SectionFrame } from "./section-frame";
import { SectionHeader } from "./section-header";
import { cn } from "@/lib/cn";
import { aleo, hostGrotesk } from "./fonts";

const ease = [0.22, 1, 0.36, 1] as const;
const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } };

function Tile({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      variants={item}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

function StepHead({ n, icon: Icon }: { n: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-secondary text-primary">
        <Icon className="size-4.5" />
      </div>
      <span className="font-mono text-sm font-semibold text-primary">{n}</span>
    </div>
  );
}

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
          viewport={{ once: true, amount: 0.25 }}
          variants={container}
          className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-3"
        >
          {/* Step 1 — wide, with a mock rule */}
          <Tile className="md:col-span-2">
            <StepHead n="01" icon={Filter} />
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">Create a watch rule</h3>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
              Pick an event type, optionally pin a wallet, and set a USD threshold — in seconds.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Token swap", "min $1,000", "wallet 7xKf…3pQ"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                >
                  {chip}
                </span>
              ))}
            </div>
          </Tile>

          {/* Step 2 */}
          <Tile>
            <StepHead n="02" icon={Radar} />
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">Sentinel watches the chain</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              A Rust matcher checks every event against your active rules in memory.
            </p>
          </Tile>

          {/* Step 3 */}
          <Tile>
            <StepHead n="03" icon={Bell} />
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">Get instant alerts</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Matches stream to your dashboard over WebSocket the moment they happen.
            </p>
          </Tile>

          {/* Step 4 — wide, with a mock alert */}
          <Tile className="md:col-span-2">
            <StepHead n="04" icon={Sparkles} />
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">Open for AI analysis</h3>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
              Pull a risk flag and a plain-English explanation on demand — cached after the first look.
            </p>
            <div className="mt-4 rounded-xl border border-border bg-background/60 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Sparkles className="size-3.5 text-primary" /> AI analysis
                <span className="ml-1 rounded-full border border-amber-500/25 bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-400">
                  Medium risk
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Large USDC swap on Jupiter — significant size, no other red flags.
              </p>
            </div>
          </Tile>
        </motion.div>
      </SectionFrame>
    </section>
  );
}
