import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { aleo, hostGrotesk } from "./fonts";
import { LANDING_ROUTES } from "@/lib/landing-routes";

export function CtaSection() {
  return (
    <section className="relative isolate bg-background">
      <div className="mx-auto max-w-6xl p-6">
        <div className="relative isolate overflow-hidden rounded-2xl border border-border bg-card px-4 py-14 text-center shadow-sm sm:px-16 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 left-1/2 h-[360px] w-[640px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
            style={{ background: "radial-gradient(closest-side, hsl(22 95% 50% / 0.22), transparent)" }}
          />
          <div className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              Live in minutes
            </span>

            <h2 className="mx-auto mt-6 max-w-3xl text-balance text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
              <span className={cn("font-thin", aleo.className)}>
                Ready to watch{" "}
                <span className={cn("font-light", hostGrotesk.className)}>Solana</span>?
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base font-medium leading-normal text-muted-foreground sm:text-lg">
              Create a rule, get live alerts, and pull AI analysis on demand. Free to start — no card
              required.
            </p>

            <div className="mt-9 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="group w-full sm:w-auto">
                <Link href={LANDING_ROUTES.signup}>
                  Start watching
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
                <Link href={LANDING_ROUTES.login}>Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
