import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-5xl font-bold tracking-tight">Sentinel</h1>
        <p className="max-w-md text-gray-500">
          A real-time watchtower for Solana. Create watch rules and get live, AI-enriched alerts the
          instant matching on-chain activity happens.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/signup" className={cn(buttonVariants())}>
          Get started
        </Link>
        <Link href="/login" className={cn(buttonVariants({ variant: "outline" }))}>
          Sign in
        </Link>
      </div>
    </main>
  );
}
