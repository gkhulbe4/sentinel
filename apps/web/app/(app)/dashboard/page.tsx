"use client";

import { Activity } from "lucide-react";
import { useLiveAlerts } from "@/features/alerts/use-live-alerts";
import { AlertFeed } from "@/features/alerts/alert-feed";
import { PageHeader } from "@/components/page-header";
import { ConnectionStatus } from "@/components/connection-status";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { alerts, status, clear } = useLiveAlerts();
  return (
    <div>
      <PageHeader
        title="Live feed"
        description="Alerts stream in the moment a rule matches."
        action={
          <>
            <ConnectionStatus status={status} />
            {alerts.length > 0 ? (
              <Button variant="outline" size="sm" onClick={clear}>
                Clear
              </Button>
            ) : null}
          </>
        }
      />
      {alerts.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-8 w-8" />}
          title={status === "open" ? "Waiting for matching activity…" : "Connecting to the live stream…"}
          description="Add rules in the Watchlist; matches appear here instantly."
        />
      ) : (
        <AlertFeed alerts={alerts} />
      )}
    </div>
  );
}
