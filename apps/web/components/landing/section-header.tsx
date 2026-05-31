"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, type Transition, type Variants } from "motion/react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

type CTA = { label: string; href?: string; icon?: ReactNode };

type SectionHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  cta?: CTA;
  align?: "left" | "center";
  className?: string;
};

const ease: Transition["ease"] = [0.22, 1, 0.36, 1];

const titleContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.01 } },
};

const charVariant: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

export function SectionHeader({ title, description, cta, align = "left", className }: SectionHeaderProps) {
  const isCenter = align === "center";
  const titleString = typeof title === "string" ? title : null;
  return (
    <div className={cn("mb-8 max-w-2xl sm:mb-12", isCenter && "mx-auto text-center", className)}>
      <motion.h2
        variants={titleContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        aria-label={titleString ?? undefined}
        className="text-3xl font-semibold leading-none tracking-tight text-balance text-foreground sm:text-5xl"
      >
        {titleString
          ? titleString.split(" ").map((word, wi, words) => (
              <span key={wi} className="inline-block whitespace-nowrap" aria-hidden>
                {Array.from(word).map((char, ci) => (
                  <motion.span key={ci} variants={charVariant} className="inline-block">
                    {char}
                  </motion.span>
                ))}
                {wi < words.length - 1 && " "}
              </span>
            ))
          : title}
      </motion.h2>

      {description && (
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, delay: 0.22, ease }}
          className={cn(
            "mt-4 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg",
            isCenter && "mx-auto",
          )}
        >
          {description}
        </motion.p>
      )}

      {cta && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, delay: 0.35, ease }}
          className={cn("mt-8", isCenter && "flex justify-center")}
        >
          <Button asChild className="inline-flex h-10 items-center gap-2 px-5">
            <Link href={cta.href ?? "#"}>
              {cta.label}
              {cta.icon}
            </Link>
          </Button>
        </motion.div>
      )}
    </div>
  );
}
