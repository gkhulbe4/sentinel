import Link from "next/link";
import { cn } from "@/lib/cn";

/** Orange radar/watchtower glyph in a rounded-square — the Sentinel mark. */
export function SentinelLogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="url(#sentinel-mark-gradient)" />
      <path
        d="M16 8.5A7.5 7.5 0 0 1 23.5 16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M16 12.5A3.5 3.5 0 0 1 19.5 16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="2.1" fill="white" />
      <defs>
        <linearGradient id="sentinel-mark-gradient" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#fb923c" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Logo mark + wordmark, linking home by default. */
export function SentinelLogo({
  className,
  iconSize = 24,
  href = "/",
}: {
  className?: string;
  iconSize?: number;
  href?: string;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 text-foreground", className)}>
      <SentinelLogoMark size={iconSize} className="rounded-lg" />
      <span className="text-xl font-semibold tracking-tight">Sentinel</span>
    </Link>
  );
}
