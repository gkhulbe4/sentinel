"use client";

import type { ReactNode } from "react";
import { AlertTriangle, ExternalLink, Loader2, Sparkles } from "lucide-react";
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
import { EVENT_ICON } from "./event-meta";
import { summarizeEvent } from "./summarize";
import { useAlertEnrichment } from "./use-enrichment";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3.5 py-2.5">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right">{children}</dd>
    </div>
  );
}

function AddrLink({ text, href }: { text: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
    >
      {text}
      <ExternalLink className="size-3 shrink-0" aria-hidden />
    </a>
  );
}

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
  const Icon = EVENT_ICON[alert.eventType];

  // Already-enriched alerts (cached real ones, or sample data) skip the API call.
  const preEnriched = alert.explanation != null && alert.riskFlag != null;
  const { data, isLoading, isError, refetch } = useAlertEnrichment(alert.id, open && !preEnriched);
  const analysis = preEnriched
    ? { explanation: alert.explanation as string, riskFlag: alert.riskFlag, riskReason: alert.riskReason }
    : data;

  return (
    <Dialog open={open} onClose={onClose} title={EVENT_TYPE_LABELS[alert.eventType]}>
      {/* Hero */}
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-primary">
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-foreground">{summarizeEvent(event)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {relativeTime(alert.createdAt)} · slot {event.slot.toLocaleString()}
          </p>
        </div>
        {analysis ? <RiskBadge flag={analysis.riskFlag} /> : null}
      </div>

      {/* Details */}
      <dl className="mt-5 divide-y divide-border overflow-hidden rounded-xl border border-border text-sm">
        <Row label="Wallet">
          <AddrLink text={shortenAddress(event.wallet)} href={solscanAccount(event.wallet)} />
        </Row>
        {event.counterparty ? (
          <Row label="Counterparty">
            <AddrLink text={shortenAddress(event.counterparty)} href={solscanAccount(event.counterparty)} />
          </Row>
        ) : null}
        {event.usdValue != null ? (
          <Row label="Value">
            <span className="font-medium text-foreground">{formatUsd(event.usdValue)}</span>
          </Row>
        ) : null}
        {event.amountSol != null ? (
          <Row label="Amount">
            <span className="text-foreground">{formatSol(event.amountSol)}</span>
          </Row>
        ) : null}
        {event.tokenMint ? (
          <Row label="Token">
            <AddrLink text={shortenAddress(event.tokenMint)} href={solscanAccount(event.tokenMint)} />
          </Row>
        ) : null}
        <Row label="Transaction">
          <AddrLink text={shortenAddress(event.signature, 6)} href={solscanTx(event.signature)} />
        </Row>
      </dl>

      {/* AI analysis */}
      <div className="mt-5 overflow-hidden rounded-xl border border-border">
        <div className="flex items-center gap-1.5 border-b border-border bg-gradient-to-r from-primary/15 to-transparent px-3.5 py-2.5 text-sm font-medium text-foreground">
          <Sparkles className="size-4 text-primary" aria-hidden />
          AI analysis
          {analysis && !preEnriched ? (
            <span className="ml-auto text-[11px] font-normal text-muted-foreground">gpt-4o-mini</span>
          ) : null}
        </div>
        <div className="px-3.5 py-3.5">
          {analysis ? (
            <div className="space-y-2.5">
              <RiskBadge flag={analysis.riskFlag} />
              <p className="text-sm leading-relaxed text-foreground">{analysis.explanation}</p>
              {analysis.riskReason ? (
                <p className="text-xs text-muted-foreground">{analysis.riskReason}</p>
              ) : null}
            </div>
          ) : isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Analyzing event…
            </div>
          ) : isError ? (
            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="size-4 text-amber-500" aria-hidden />
                Couldn’t analyze this event.
              </span>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </Dialog>
  );
}
