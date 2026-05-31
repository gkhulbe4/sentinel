import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { FOOTER_LINKS, LEGAL_LINKS } from "@/lib/landing-routes";
import { SentinelLogo } from "@/components/brand/sentinel-logo";

const TOP_EDGE =
  "M0 4a4 4 0 0 1 4-4h344.32c4.197 0 8.369.66 12.361 1.958l49.5 16.084A40 40 0 0 0 422.542 20h517.7c4.293 0 8.559-.691 12.633-2.047l47.785-15.906A40 40 0 0 1 1013.29 0H1356a4 4 0 0 1 4 4";

function FooterRails() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
      <div className="relative mx-auto h-full max-w-6xl">
        <div className="absolute inset-y-0 left-0 w-px bg-border" />
        <div className="absolute inset-y-0 right-0 w-px bg-border" />
      </div>
    </div>
  );
}

function FooterTopEdge() {
  return (
    <div aria-hidden className="relative">
      <svg
        width="100%"
        height="20"
        viewBox="0 0 1360 20"
        fill="none"
        preserveAspectRatio="none"
        className="block w-full"
      >
        <path d={`${TOP_EDGE}v16H0z`} className="fill-card" />
      </svg>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative">
      <FooterTopEdge />
      <div className="relative bg-card pb-6">
        <div className="relative mx-auto max-w-6xl px-6 pt-10 sm:pt-14">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-5">
            <div className="col-span-2">
              <SentinelLogo />
              <p className="mt-3 max-w-xs text-sm text-pretty text-muted-foreground">
                The real-time watchtower for Solana — rules, live alerts, and on-demand AI analysis.
              </p>
            </div>
            {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
              <div key={heading}>
                <div className="mb-3 text-xs font-medium text-foreground">{heading}</div>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                        <ArrowUpRight className="size-3.5 -translate-x-0.5 -translate-y-px opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div
            className={cn(
              "-mx-6 mt-12 flex flex-col items-center justify-between border-t border-border px-6 pt-6 sm:flex-row",
              "text-xs text-muted-foreground",
            )}
          >
            <div>© {new Date().getFullYear()} Sentinel</div>
            <div className="flex items-center gap-4">
              {LEGAL_LINKS.map((link) => (
                <Link key={link.label} href={link.href} className="hover:text-foreground">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <FooterRails />
    </footer>
  );
}
