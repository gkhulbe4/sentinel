import Link from "next/link";
import { ListChecks } from "lucide-react";
import { auth } from "@/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const session = await auth();
  const email = session?.user?.email ?? "";
  const name = session?.user?.name ?? null;
  const initial = (name?.trim()?.[0] ?? email?.[0] ?? "?").toUpperCase();

  return (
    <div className="mx-auto w-full max-w-lg">
      <Card className="overflow-hidden">
        {/* Gradient header */}
        <div className="relative h-24 bg-gradient-to-br from-orange-500/30 via-orange-600/15 to-card">
          <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>

        <div className="-mt-10 flex flex-col items-center px-6 pb-8 text-center">
          <div className="flex size-20 items-center justify-center rounded-full border-4 border-card bg-primary/15 text-2xl font-semibold text-primary shadow-lg">
            {initial}
          </div>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">{name ?? "Account"}</h2>
          <p className="text-sm text-muted-foreground">{email}</p>

          <dl className="mt-6 w-full divide-y divide-border overflow-hidden rounded-xl border border-border text-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium text-foreground">{name ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium text-foreground">{email}</dd>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="text-muted-foreground">Plan</dt>
              <dd>
                <span className="rounded-full border border-primary/25 bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                  Free
                </span>
              </dd>
            </div>
          </dl>

          <Button asChild variant="secondary" className="mt-6 w-full">
            <Link href="/watchlist">
              <ListChecks className="size-4" />
              Manage watch rules
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
