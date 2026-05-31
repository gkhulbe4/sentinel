import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function SectionFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto max-w-6xl border-x border-dashed border-border", className)}>
      {children}
    </div>
  );
}
