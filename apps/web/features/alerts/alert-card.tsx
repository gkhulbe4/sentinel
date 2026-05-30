import { memo } from "react";
import { Sparkles } from "lucide-react";
import {
  type Alert,
  EVENT_TYPE_LABELS,
  relativeTime,
  shortenAddress,
  solscanAccount,
  solscanTx,
} from "@sentinel/shared";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { RiskBadge } from "./risk-badge";
import { summarizeEvent } from "./summarize";

// Memoized so prepending/patching one alert doesn't re-render the whole feed.
export const AlertCard = memo(function AlertCard({
  alert,
  animate = false,
}: {
  alert: Alert;
  animate?: boolean;
}) {
  const { event } = alert;
  return (
    <Card className={cn("p-4", animate && "animate-alert-in")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {EVENT_TYPE_LABELS[alert.eventType]}
          </span>
          <RiskBadge flag={alert.riskFlag} />
        </div>
        <time className="shrink-0 text-xs text-gray-400" dateTime={alert.createdAt}>
          {relativeTime(alert.createdAt)}
        </time>
      </div>

      <p className="mt-2 text-sm font-medium">{summarizeEvent(event)}</p>

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
        <a
          href={solscanAccount(event.wallet)}
          target="_blank"
          rel="noreferrer"
          className="hover:text-indigo-600 hover:underline"
        >
          {shortenAddress(event.wallet)}
        </a>
        {event.counterparty ? <span>→ {shortenAddress(event.counterparty)}</span> : null}
        <a
          href={solscanTx(event.signature)}
          target="_blank"
          rel="noreferrer"
          className="hover:text-indigo-600 hover:underline"
        >
          tx ↗
        </a>
      </div>

      <div className="mt-2 flex items-start gap-1.5 text-sm">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" aria-hidden />
        {alert.explanation ? (
          <span className="text-gray-700 dark:text-gray-300">{alert.explanation}</span>
        ) : (
          <span className="animate-pulse text-gray-400">enriching…</span>
        )}
      </div>
    </Card>
  );
});
