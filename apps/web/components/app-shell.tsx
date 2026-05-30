"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bell, ListChecks, Settings } from "lucide-react";
import { cn } from "@/lib/cn";
import { SignOutButton } from "@/features/auth/sign-out-button";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Activity },
  { href: "/watchlist", label: "Watchlist", icon: ListChecks },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ email, children }: { email?: string | null; children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/dashboard" className="font-bold tracking-tight">
              Sentinel
            </Link>
            <nav className="flex items-center gap-1">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors sm:px-3",
                      active
                        ? "bg-gray-100 font-medium dark:bg-gray-800"
                        : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {email ? (
              <span className="hidden text-sm text-gray-500 md:inline">{email}</span>
            ) : null}
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
