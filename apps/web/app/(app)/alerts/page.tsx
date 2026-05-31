"use client";

import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { useAlerts } from "@/features/alerts/use-alerts";
import { generateSampleAlerts } from "@/features/alerts/use-sample-stream";
import { AlertCard } from "@/features/alerts/alert-card";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function AlertsPage() {
  const { data, isLoading, isError } = useAlerts();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const sample = useMemo(() => generateSampleAlerts(8), []);

  const loading = !mounted || isLoading;
  const hasReal = !!data && data.length > 0;
  const list = data && data.length > 0 ? data : sample;

  return (
    <div>
      <PageHeader title="Alert history" description="Your most recent alerts, newest first." />

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Failed to load alerts.</p>
      ) : (
        <>
          {!hasReal ? (
            <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <Info className="size-4 text-primary" /> Sample data
              </span>
              <span className="text-muted-foreground">
                — no alerts saved yet. Real alerts are stored here once a watched wallet&rsquo;s
                activity matches a rule.
              </span>
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            {list.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
