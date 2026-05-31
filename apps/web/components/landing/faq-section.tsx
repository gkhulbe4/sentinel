"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { SectionShell } from "./section-shell";
import { SentinelLogoMark } from "@/components/brand/sentinel-logo";
import { cn } from "@/lib/cn";
import { aleo, hostGrotesk } from "./fonts";
import { LANDING_ROUTES } from "@/lib/landing-routes";

const ease: Transition["ease"] = [0.22, 1, 0.36, 1];

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "What can Sentinel watch?",
    a: "Token swaps, SOL transfers, new token launches, and activity on a specific wallet — each with an optional minimum USD threshold so you only hear about what matters.",
  },
  {
    q: "How fast are alerts?",
    a: "Matches stream to your dashboard over WebSocket the instant they happen — typically in well under a second. The feed is virtualized, so it stays smooth even with thousands of alerts loaded.",
  },
  {
    q: "Do I need an OpenAI key?",
    a: "No. AI analysis is optional and computed on demand when you open an alert. Without a key, Sentinel falls back to a deterministic local heuristic, so the feature still works.",
  },
  {
    q: "Is this real on-chain data?",
    a: "Yes — point it at a free Helius/QuickNode RPC key and it watches the wallets in your rules live. There's also a Helius webhook path and a paid Yellowstone gRPC firehose for market-wide coverage.",
  },
  {
    q: "What does it take to run?",
    a: "Postgres and Redis plus the services. AI analysis is cached after the first look, so you only spend on the alerts you actually open.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <SectionShell
      title={
        <span className={cn("font-thin", aleo.className)}>
          Frequently asked{" "}
          <span className={cn("font-light", hostGrotesk.className)}>questions</span>
        </span>
      }
      subtitle="Everything you need to know about Sentinel — rules, alerts, AI analysis, and running it."
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-5">
          <div className="lg:col-span-3 lg:border-r lg:border-border">
            {FAQS.map((item, i) => (
              <FaqRow
                key={item.q}
                item={item}
                isOpen={openIndex === i}
                isLast={i === FAQS.length - 1}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>

          {/* Visual aside (right) */}
          <aside className="relative min-h-56 overflow-hidden sm:min-h-72 lg:col-span-2 lg:min-h-0">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/25 via-orange-600/10 to-background" />
            <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-[60%] rounded-full bg-orange-500/30 blur-3xl"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <SentinelLogoMark size={96} className="rounded-2xl shadow-2xl" />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 sm:p-6">
              <p className="text-balance text-base font-semibold leading-snug tracking-tight text-white">
                Watch Solana where it happens.
              </p>
              <p className="mt-1 text-pretty text-xs leading-relaxed text-white/75">
                Real-time on-chain monitoring with AI risk analysis on every alert.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <p className="mt-6 text-sm text-pretty text-muted-foreground">
        Still have questions?{" "}
        <Link
          href={LANDING_ROUTES.signup}
          className="font-medium text-foreground transition-colors hover:text-primary"
        >
          Create an account →
        </Link>
      </p>
    </SectionShell>
  );
}

function FaqRow({
  item,
  isOpen,
  isLast,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  isLast: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={cn(!isLast && "border-b border-border")}>
      <button
        type="button"
        onClick={onToggle}
        data-expanded={isOpen}
        className="group flex w-full items-center justify-between gap-6 px-5 py-5 text-left transition-colors hover:bg-muted/50 sm:px-6"
      >
        <span className="text-base font-medium leading-snug tracking-tight text-foreground">{item.q}</span>
        <PlusToggle isOpen={isOpen} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease }}
            className="overflow-hidden"
          >
            <p className="-mt-1 max-w-2xl px-5 pb-5 text-sm leading-relaxed text-pretty text-muted-foreground sm:px-6">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlusToggle({ isOpen }: { isOpen: boolean }) {
  return (
    <span
      className="relative flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 transition-colors group-hover:bg-muted"
      aria-hidden
    >
      <span className="absolute h-px w-3 bg-foreground" />
      <motion.span
        animate={{ rotate: isOpen ? 0 : 90 }}
        transition={{ duration: 0.25, ease }}
        className="absolute h-px w-3 bg-foreground"
      />
    </span>
  );
}
