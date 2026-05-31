"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { SectionShell } from "./section-shell";
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
    a: "Sentinel ships with a mock event source for demos, plus a documented Yellowstone (Helius gRPC) seam so you can stream live Solana data through the exact same pipeline.",
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
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
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
