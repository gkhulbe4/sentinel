import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Decorative full-height vertical rails framing the page content (md+). */
export function PageRails() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[60] hidden md:block">
      <div className="relative mx-auto h-full max-w-6xl">
        <div className="absolute inset-y-0 left-0 w-px bg-border" />
        <div className="absolute inset-y-0 right-0 w-px bg-border" />
      </div>
    </div>
  );
}

interface SectionWrapProps {
  children: ReactNode;
  first?: boolean;
  id?: string;
}

/** A landing section with a top border + plus-mark rail intersections. */
export function SectionWrap({ children, first, id }: SectionWrapProps) {
  return (
    <div id={id} className={cn("relative scroll-mt-14", !first && "border-t border-border")}>
      {!first && <RailIntersection />}
      {children}
    </div>
  );
}

export function RailIntersection() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[70] hidden md:block">
      <div className="relative mx-auto h-0 max-w-6xl">
        <PlusMark className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2" />
        <PlusMark className="absolute right-0 top-0 -translate-y-1/2 translate-x-1/2" />
      </div>
    </div>
  );
}

function PlusMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex h-5 w-5 items-center justify-center bg-background", className)}>
      <svg
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        className="h-4 w-4 text-primary/70"
      >
        <path d="M6 1v10M1 6h10" />
      </svg>
    </span>
  );
}
