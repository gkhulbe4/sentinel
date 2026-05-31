"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Info, Radar } from "lucide-react";
import { EVENT_TYPE_LABELS, type RuleDto, shortenAddress } from "@sentinel/shared";
import { useLiveAlerts } from "@/features/alerts/use-live-alerts";
import { useSampleStream } from "@/features/alerts/use-sample-stream";
import { useWatchRules } from "@/features/watchlist/use-watch-rules";
import { AlertFeed } from "@/features/alerts/alert-feed";
import { DashboardBanner } from "@/features/alerts/dashboard-banner";
import { RuleTabs } from "@/features/alerts/rule-tabs";
import { Button } from "@/components/ui/button";

function WaitingState({ rule }: { rule: RuleDto }) {
  const label = rule.walletAddr ? shortenAddress(rule.walletAddr) : EVENT_TYPE_LABELS[rule.eventType];
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
      <span className="relative flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/20" />
        <Radar className="size-5" aria-hidden />
      </span>
      <div>
        <h3 className="font-medium text-foreground">Watching {label}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Live — no matching activity yet. Real alerts stream in here the moment this wallet transacts.
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { alerts, status, clear } = useLiveAlerts();
  const { query } = useWatchRules();
  const activeRules = (query.data ?? []).filter((r) => r.isActive);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Default to the first active rule; keep a valid selection as rules change.
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    const rs = (query.data ?? []).filter((r) => r.isActive);
    const first = rs[0];
    if (!first) {
      setSelected(null);
      return;
    }
    setSelected((cur) => (cur && rs.some((r) => r.id === cur) ? cur : first.id));
  }, [query.data]);

  const hasTrackers = activeRules.length > 0;
  const selectedRule = activeRules.find((r) => r.id === selected) ?? null;
  const realForTab = selectedRule ? alerts.filter((a) => a.ruleId === selectedRule.id) : [];
  const isWalletRule = Boolean(selectedRule?.walletAddr);

  // Mock only for the pure demo (no rules) or a market-wide rule (no wallet —
  // the free tier can't watch the whole chain). Wallet trackers never show mock.
  const mockActive =
    mounted && (!hasTrackers || (selectedRule != null && !isWalletRule && realForTab.length === 0));
  const sample = useSampleStream(mockActive, selectedRule?.eventType);

  return (
    <div className="flex flex-col">
      <DashboardBanner status={status} ruleCount={activeRules.length} alertCount={alerts.length} />

      {hasTrackers ? (
        <div className="mb-4 flex items-center gap-2">
          <RuleTabs
            rules={activeRules}
            selected={selected ?? activeRules[0]!.id}
            onSelect={setSelected}
            className="flex-1"
          />
          {alerts.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={clear} className="shrink-0">
              Clear
            </Button>
          ) : null}
        </div>
      ) : null}

      {!mounted ? null : !hasTrackers ? (
        <>
          <SampleBanner>
            add a rule with a wallet address in the{" "}
            <Link href="/watchlist" className="font-medium text-foreground hover:text-primary">
              Watchlist
            </Link>{" "}
            to stream its real on-chain activity.
          </SampleBanner>
          <AlertFeed alerts={sample} />
        </>
      ) : realForTab.length > 0 ? (
        <AlertFeed alerts={realForTab} />
      ) : isWalletRule ? (
        selectedRule ? <WaitingState rule={selectedRule} /> : null
      ) : (
        <>
          <SampleBanner>
            market-wide tracking needs the paid firehose (see the Watchlist), so this tracker shows
            sample events.
          </SampleBanner>
          <AlertFeed alerts={sample} />
        </>
      )}
    </div>
  );
}

function SampleBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 text-sm">
      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
        <Info className="size-4 text-primary" /> Sample data (live demo)
      </span>
      <span className="text-muted-foreground">— {children}</span>
    </div>
  );
}
