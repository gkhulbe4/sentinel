"use client";

import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import {
  type Alert,
  EVENT_TYPE_LABELS,
  formatSol,
  formatUsd,
  relativeTime,
  shortenAddress,
  solscanAccount,
  solscanTx,
} from "@sentinel/shared";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "./risk-badge";
import { summarizeEvent } from "./summarize";
import { useAlertEnrichment } from "./use-enrichment";

export function AlertDetailsDialog({
  alert,
  open,
  onClose,
}: {
  alert: Alert;
  open: boolean;
  onClose: () => void;
}) {
  const { event } = alert;
  const { data, isLoading, isError, refetch } = useAlertEnrichment(alert.id, open);

  return (
    <Dialog open={open} onClose={onClose} title={EVENT_TYPE_LABELS[alert.eventType]}>
      <p className="text-sm font-medium text-foreground">{summarizeEvent(event)}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{relativeTime(alert.createdAt)}</p>

      <dl className="mt-4 grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Wallet</dt>
        <dd>
          <a
            href={solscanAccount(event.wallet)}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            {shortenAddress(event.wallet)}
          </a>
        </dd>

        {event.counterparty ? (
          <>
            <dt className="text-muted-foreground">Counterparty</dt>
            <dd>{shortenAddress(event.counterparty)}</dd>
          </>
        ) : null}

        {event.usdValue != null ? (
          <>
            <dt className="text-muted-foreground">Value</dt>
            <dd>{formatUsd(event.usdValue)}</dd>
          </>
        ) : null}

        {event.amountSol != null ? (
          <>
            <dt className="text-muted-foreground">Amount</dt>
            <dd>{formatSol(event.amountSol)}</dd>
          </>
        ) : null}

        {event.tokenMint ? (
          <>
            <dt className="text-muted-foreground">Token</dt>
            <dd>{shortenAddress(event.tokenMint)}</dd>
          </>
        ) : null}

        <dt className="text-muted-foreground">Transaction</dt>
        <dd>
          <a
            href={solscanTx(event.signature)}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            {shortenAddress(event.signature, 6)} ↗
          </a>
        </dd>
      </dl>

      <div className="mt-5 rounded-xl border border-border bg-background/40 p-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          AI analysis
        </div>

        {isLoading ? (
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Analyzing event…
          </div>
        ) : isError ? (
          <div className="mt-2 flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
              Couldn’t analyze this event.
            </span>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : data ? (
          <div className="mt-2 space-y-2">
            <RiskBadge flag={data.riskFlag} />
            <p className="text-sm text-foreground">{data.explanation}</p>
            {data.riskReason ? <p className="text-xs text-muted-foreground">{data.riskReason}</p> : null}
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}
