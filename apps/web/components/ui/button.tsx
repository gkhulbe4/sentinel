import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * Physical button language — the primary action uses an orange gradient body
 * with an inset top highlight (raised edge), inset bottom shadow (depth), and an
 * outer drop shadow. Secondary/outline are subtle surfaces; ghost and link stay
 * flat. Token-driven so it tracks the black + orange theme.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-70 focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:ring-3 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /* Orange raised — primary action */
        default:
          "bg-linear-to-b from-orange-500 to-orange-600 text-white shadow-[inset_0_1.5px_0_0_rgba(255,255,255,0.3),inset_0_-2px_0_0_rgba(0,0,0,0.3),0_1px_2px_0_rgba(234,88,12,0.3),0_2px_8px_1px_rgba(234,88,12,0.25)] hover:from-orange-400 hover:to-orange-500 focus-visible:border-ring",
        /* Subtle raised surface — secondary action */
        secondary:
          "border border-border bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_1px_2px_0_rgba(0,0,0,0.3)] hover:bg-accent",
        /* Outline — transparent surface */
        outline:
          "border border-border bg-transparent text-foreground hover:bg-accent aria-expanded:bg-accent",
        /* Destructive raised — danger action */
        destructive:
          "bg-linear-to-b from-red-500 to-red-700 text-white shadow-[inset_0_1.5px_0_0_rgba(255,255,255,0.2),inset_0_-2px_0_0_rgba(0,0,0,0.4),0_1px_2px_0_rgba(185,28,28,0.25)] hover:brightness-110 focus-visible:ring-destructive/40",
        /* Flat — toolbars, icon buttons */
        ghost: "text-foreground hover:bg-accent aria-expanded:bg-accent",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-1.5 px-3.5",
        xs: "h-6 gap-1 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-md px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-1.5 px-4",
        icon: "size-9",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, className }), "duration-150 ease-out active:scale-[0.99]");

  if (asChild) {
    return (
      <Slot.Root data-slot="button" className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      data-slot="button"
      data-loading={loading || undefined}
      {...(loading ? { "aria-busy": true } : {})}
      disabled={loading || disabled}
      className={classes}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </button>
  );
}

export { Button, buttonVariants };
