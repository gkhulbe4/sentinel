"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { useLiveAlerts } from "@/features/alerts/use-live-alerts";
import { useSampleStream } from "@/features/alerts/use-sample-stream";
import { useWatchRules } from "@/features/watchlist/use-watch-rules";
import { AlertFeed } from "@/features/alerts/alert-feed";
import { DashboardBanner } from "@/features/alerts/dashboard-banner";
import { RuleTabs } from "@/features/alerts/rule-tabs";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { alerts, status, clear } = useLiveAlerts();
  const { query } = useWatchRules();
  const rules = query.data ?? [];

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Default to the first rule's tab; keep a valid selection as rules change.
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    const rs = query.data ?? [];
    const first = rs[0];
    if (!first) {
      setSelected(null);
      return;
    }
    setSelected((cur) => (cur && rs.some((r) => r.id === cur) ? cur : first.id));
  }, [query.data]);

  const selectedRule = rules.find((r) => r.id === selected) ?? null;
  const realForTab = selectedRule ? alerts.filter((a) => a.ruleId === selectedRule.id) : alerts;
  const noReal = realForTab.length === 0;
  const sample = useSampleStream(mounted && noReal, selectedRule?.eventType);
  const feed = noReal ? sample : realForTab;
  const showingSample = mounted && noReal;

  return (
    <div className="flex flex-col">
      <DashboardBanner status={status} ruleCount={rules.length} alertCount={alerts.length} />

      {rules.length > 0 && selected ? (
        <div className="mb-4 flex items-center gap-2">
          <RuleTabs rules={rules} selected={selected} onSelect={setSelected} className="flex-1" />
          {alerts.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={clear} className="shrink-0">
              Clear
            </Button>
          ) : null}
        </div>
      ) : null}

      {showingSample ? (
        <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 text-sm">
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <Info className="size-4 text-primary" /> Sample data (live demo)
          </span>
          {rules.length === 0 ? (
            <span className="text-muted-foreground">
              — add a rule with a wallet address in the{" "}
              <Link href="/watchlist" className="font-medium text-foreground hover:text-primary">
                Watchlist
              </Link>{" "}
              to stream its real on-chain activity.
            </span>
          ) : (
            <span className="text-muted-foreground">
              — this tracker has no live matches yet; showing sample events meanwhile.
            </span>
          )}
        </div>
      ) : null}

      {mounted ? <AlertFeed alerts={feed} /> : null}
    </div>
  );
}
