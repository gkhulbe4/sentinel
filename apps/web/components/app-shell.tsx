"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  ListChecks,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { SentinelLogoMark } from "@/components/brand/sentinel-logo";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Activity },
  { href: "/watchlist", label: "Watchlist", icon: ListChecks },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ email, children }: { email?: string | null; children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = NAV.find((n) => isActive(pathname, n.href))?.label ?? "Sentinel";

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <Sidebar
        className="hidden md:flex"
        collapsed={collapsed}
        pathname={pathname}
        email={email}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} aria-hidden />
          <Sidebar
            className="relative z-10 flex border-r border-border bg-background"
            collapsed={false}
            pathname={pathname}
            email={email}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      ) : null}

      {/* Main: floating panel with topbar */}
      <div className="flex min-w-0 flex-1 flex-col md:py-2 md:pr-2">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-border bg-card md:rounded-xl md:border md:shadow-[0_2px_24px_-6px_rgba(0,0,0,0.5)]">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 sm:px-6">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="-ml-1 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-sm font-semibold tracking-tight text-foreground">{title}</h1>
            {email ? (
              <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">{email}</span>
            ) : null}
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function Sidebar({
  collapsed,
  pathname,
  email,
  className,
  onToggleCollapse,
  onNavigate,
}: {
  collapsed: boolean;
  pathname: string;
  email?: string | null;
  className?: string;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}) {
  return (
    <aside
      className={cn(
        "h-full shrink-0 flex-col transition-[width] duration-200 ease-out",
        collapsed ? "w-14" : "w-60",
        className,
      )}
    >
      {/* Brand + collapse / close */}
      <div className={cn("flex h-14 shrink-0 items-center gap-2", collapsed ? "justify-center px-2" : "px-3")}>
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        ) : (
          <>
            <Link
              href="/dashboard"
              onClick={onNavigate}
              className="flex min-w-0 flex-1 items-center gap-2 text-foreground"
              aria-label="Sentinel home"
            >
              <SentinelLogoMark size={24} className="rounded-lg" />
              <span className="text-[17px] font-semibold tracking-tight">Sentinel</span>
            </Link>
            {onToggleCollapse ? (
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label="Collapse sidebar"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            ) : null}
            {onNavigate ? (
              <button
                type="button"
                onClick={onNavigate}
                aria-label="Close menu"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3" aria-label="Main">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              title={collapsed ? label : undefined}
              className={cn(
                "relative flex items-center gap-2.5 rounded-md py-2 text-sm transition-colors",
                collapsed ? "justify-center px-0" : "px-2.5",
                active
                  ? "bg-accent font-medium text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              {active ? (
                <span aria-hidden className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
              ) : null}
              <Icon className={cn("shrink-0", active && "text-primary")} size={collapsed ? 18 : 16} aria-hidden />
              {!collapsed ? <span className="min-w-0 flex-1 truncate">{label}</span> : null}
            </Link>
          );
        })}
      </nav>

      {/* Footer — account */}
      <div className={cn("flex shrink-0 flex-col gap-2 border-t border-border/60 p-2", collapsed && "items-center")}>
        {!collapsed && email ? (
          <span className="truncate px-1 text-xs text-muted-foreground" title={email}>
            {email}
          </span>
        ) : null}
        <div className={cn("flex items-center gap-1", collapsed ? "flex-col" : "justify-between")}>
          <ThemeToggle />
          <SignOutButton collapsed={collapsed} />
        </div>
      </div>
    </aside>
  );
}
