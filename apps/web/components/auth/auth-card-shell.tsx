import type { ReactNode } from "react";

export interface AuthCardShellProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function AuthCardShell({ title, description, children }: AuthCardShellProps) {
  return (
    <div className="w-full space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-balance text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
