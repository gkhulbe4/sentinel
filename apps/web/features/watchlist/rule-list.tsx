"use client";

import { Trash2 } from "lucide-react";
import { EVENT_TYPE_LABELS, formatUsd, shortenAddress } from "@sentinel/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useWatchRules } from "./use-watch-rules";

export function RuleList() {
  const { query, update, remove } = useWatchRules();

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }
  if (query.isError) {
    return <p className="text-sm text-red-600">Failed to load rules.</p>;
  }

  const rules = query.data ?? [];
  if (rules.length === 0) {
    return (
      <EmptyState
        title="No rules yet"
        description="Add a watch rule on the left to start receiving live alerts."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{EVENT_TYPE_LABELS[rule.eventType]}</span>
              {!rule.isActive ? <Badge variant="neutral">paused</Badge> : null}
            </div>
            <div className="flex flex-wrap gap-x-3 text-xs text-gray-500">
              {rule.walletAddr ? <span>wallet {shortenAddress(rule.walletAddr)}</span> : null}
              {rule.minUsd != null ? <span>min {formatUsd(rule.minUsd)}</span> : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => update.mutate({ id: rule.id, input: { isActive: !rule.isActive } })}
            >
              {rule.isActive ? "Pause" : "Resume"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete rule"
              onClick={() => remove.mutate(rule.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
