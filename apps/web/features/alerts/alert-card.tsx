import { memo, useState } from "react";
import {
  type Alert,
  EVENT_TYPE_LABELS,
  relativeTime,
  shortenAddress,
  solscanAccount,
  solscanTx,
} from "@sentinel/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { summarizeEvent } from "./summarize";
import { AlertDetailsDialog } from "./alert-details-dialog";

// Memoized so prepending one alert doesn't re-render the whole feed. AI analysis
// is fetched on demand when the user opens an alert (no eager enrichment).
export const AlertCard = memo(function AlertCard({
  alert,
  animate = false,
}: {
  alert: Alert;
  animate?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { event } = alert;
  return (
    <Card className={cn("p-4 transition-colors hover:border-primary/40", animate && "animate-alert-in")}>
      <div className="flex items-start justify-between gap-3">
        <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground">
          {EVENT_TYPE_LABELS[alert.eventType]}
        </span>
        <time className="shrink-0 text-xs text-muted-foreground" dateTime={alert.createdAt}>
          {relativeTime(alert.createdAt)}
        </time>
      </div>

      <p className="mt-2 text-sm font-medium text-foreground">{summarizeEvent(event)}</p>

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <a
          href={solscanAccount(event.wallet)}
          target="_blank"
          rel="noreferrer"
          className="hover:text-primary hover:underline"
        >
          {shortenAddress(event.wallet)}
        </a>
        {event.counterparty ? <span>→ {shortenAddress(event.counterparty)}</span> : null}
        <a
          href={solscanTx(event.signature)}
          target="_blank"
          rel="noreferrer"
          className="hover:text-primary hover:underline"
        >
          tx ↗
        </a>
      </div>

      <div className="mt-3 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Open
        </Button>
      </div>

      <AlertDetailsDialog alert={alert} open={open} onClose={() => setOpen(false)} />
    </Card>
  );
});
