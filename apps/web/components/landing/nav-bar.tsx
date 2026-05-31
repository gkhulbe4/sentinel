"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { Menu, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { LANDING_ROUTES, NAV_ITEMS } from "@/lib/landing-routes";
import { SentinelLogo } from "@/components/brand/sentinel-logo";
import { Button } from "@/components/ui/button";

const menuEase: Transition["ease"] = [0.22, 1, 0.36, 1];

function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return null;
}

export function NavBar({ floatOnScroll = false }: { floatOnScroll?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!floatOnScroll) return;
    const target: HTMLElement | Window = getScrollParent(headerRef.current) ?? window;
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const top = target === window ? window.scrollY : (target as HTMLElement).scrollTop;
        setScrolled(top > 16);
        ticking = false;
      });
    }
    onScroll();
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [floatOnScroll]);

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-14 border-b transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        scrolled ? "border-b-transparent bg-transparent" : "border-b-border bg-background",
      )}
    >
      <div
        className={cn(
          "mx-auto flex items-center justify-between border px-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          scrolled
            ? "mt-1.5 h-14 max-w-5xl rounded-lg border-border bg-card shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4)]"
            : "h-full max-w-6xl rounded-none border-transparent bg-transparent shadow-none",
        )}
      >
        <SentinelLogo iconSize={26} />

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-[14px] font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={LANDING_ROUTES.login}
            className="hidden text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Sign in
          </Link>
          <Button asChild size="sm" className="h-8.5 px-3! text-[13px]">
            <Link href={LANDING_ROUTES.signup}>
              Get started
              <ChevronRight className="size-3" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="text-muted-foreground md:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: menuEase }}
            className="overflow-hidden border-b border-border bg-background md:hidden"
          >
            <nav className="mx-auto flex max-w-6xl flex-col px-4 py-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href={LANDING_ROUTES.login}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              >
                Sign in
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
