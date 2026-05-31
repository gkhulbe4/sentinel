import { type VariantProps, cva } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "border-border bg-secondary text-secondary-foreground",
        orange: "border-primary/25 bg-primary/15 text-primary",
        blue: "border-sky-500/25 bg-sky-500/15 text-sky-400",
        amber: "border-amber-500/25 bg-amber-500/15 text-amber-400",
        red: "border-red-500/25 bg-red-500/15 text-red-400",
        green: "border-emerald-500/25 bg-emerald-500/15 text-emerald-400",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
