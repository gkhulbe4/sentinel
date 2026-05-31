"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { type CSSProperties, type ReactNode, useState } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 10_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          closeButton
          toastOptions={{
            classNames: {
              toast: "rounded-xl border-border shadow-lg",
              title: "font-medium",
              description: "text-muted-foreground",
              actionButton: "rounded-md",
            },
          }}
          style={
            {
              "--normal-bg": "var(--card)",
              "--normal-border": "var(--border)",
              "--normal-text": "var(--foreground)",
              "--border-radius": "0.75rem",
            } as CSSProperties
          }
        />
      </QueryClientProvider>
    </SessionProvider>
  );
}
