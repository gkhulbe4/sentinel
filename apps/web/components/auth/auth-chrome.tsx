import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { SentinelLogoMark } from "@/components/brand/sentinel-logo";
import { PageRails, RailIntersection } from "@/components/landing/page-shell";

export function AuthChrome({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip overflow-y-auto bg-background">
      <PageRails />

      <main className="relative flex flex-1 flex-col justify-center">
        <div className="relative hidden border-t border-border md:block">
          <RailIntersection />
        </div>

        <div className="flex items-center justify-center px-4 py-14 md:py-20">
          <div className="w-full max-w-md">
            <div className="mb-7 flex flex-col items-center gap-3 text-center">
              <Link href="/" aria-label="Sentinel home" className="flex items-center gap-2.5">
                <SentinelLogoMark size={26} className="rounded-lg" />
                <span className="text-lg font-semibold tracking-tight text-foreground">Sentinel</span>
              </Link>
              <p className="max-w-xs text-balance text-[13px] leading-relaxed text-muted-foreground">
                The real-time watchtower for Solana.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              {children}
            </div>

            <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0 text-foreground/45" aria-hidden />
              Live on-chain monitoring · Secure by design
            </p>

            <footer className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span>© {new Date().getFullYear()} Sentinel</span>
              <Link
                href="/"
                className="underline-offset-4 [@media(hover:hover)_and_(pointer:fine)]:hover:underline"
              >
                Home
              </Link>
            </footer>
          </div>
        </div>

        <div className="relative hidden border-t border-border md:block">
          <RailIntersection />
        </div>
      </main>
    </div>
  );
}

export const authFooterLinkClass =
  "font-medium text-foreground text-sm underline-offset-4 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:underline";
