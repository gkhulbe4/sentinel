import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

export interface AuthFieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function AuthField({ id, label, error, children, className }: AuthFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs leading-tight text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
