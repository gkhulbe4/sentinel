import { type VariantProps, cva } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
        amber: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
        red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
        green: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
