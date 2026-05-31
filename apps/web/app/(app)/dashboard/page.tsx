"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { useLiveAlerts } from "@/features/alerts/use-live-alerts";
import { AlertFeed } from "@/features/alerts/alert-feed";
import { SAMPLE_ALERTS } from "@/features/alerts/sample-alerts";
import { PageHeader } from "@/components/page-header";
import { ConnectionStatus } from "@/components/connection-status";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { alerts, status, clear } = useLiveAlerts();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hasReal = alerts.length > 0;
  const showingSample = mounted && !hasReal;
  const feed = hasReal ? alerts : SAMPLE_ALERTS;

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Live feed"
        description="Alerts stream in the moment a rule matches."
        action={
          <>
            <ConnectionStatus status={status} />
            {hasReal ? (
              <Button variant="outline" size="sm" onClick={clear}>
                Clear
              </Button>
            ) : null}
          </>
        }
      />

      {showingSample ? (
        <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 text-sm">
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <Info className="size-4 text-primary" /> Showing sample data
          </span>
          <span className="text-muted-foreground">
            — add a rule with a wallet address in the{" "}
            <Link href="/watchlist" className="font-medium text-foreground hover:text-primary">
              Watchlist
            </Link>{" "}
            to see live on-chain activity.
          </span>
        </div>
      ) : null}

      {mounted ? <AlertFeed alerts={feed} /> : null}
    </div>
  );
}
