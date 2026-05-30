"use client";

import { Bell } from "lucide-react";
import { useAlerts } from "@/features/alerts/use-alerts";
import { AlertCard } from "@/features/alerts/alert-card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function AlertsPage() {
  const { data, isLoading, isError } = useAlerts();
  return (
    <div>
      <PageHeader title="Alert history" description="Your most recent alerts." />
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-red-600">Failed to load alerts.</p>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title="No alerts yet"
          description="Once your rules match on-chain activity, alerts show up here."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}
