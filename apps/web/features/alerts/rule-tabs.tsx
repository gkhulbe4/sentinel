"use client";

import type { LucideIcon } from "lucide-react";
import { EVENT_TYPE_LABELS, type RuleDto, shortenAddress } from "@sentinel/shared";
import { cn } from "@/lib/cn";
import { EVENT_ICON } from "./event-meta";

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-primary/40 bg-primary/15 font-medium text-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon className={cn("size-3.5", active && "text-primary")} aria-hidden />
      <span className="max-w-44 truncate">{label}</span>
    </button>
  );
}

export function RuleTabs({
  rules,
  selected,
  onSelect,
  className,
}: {
  rules: RuleDto[];
  selected: string;
  onSelect: (ruleId: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1.5 overflow-x-auto pb-1", className)}>
      {rules.map((rule) => {
        const label = rule.walletAddr
          ? `${EVENT_TYPE_LABELS[rule.eventType]} · ${shortenAddress(rule.walletAddr)}`
          : EVENT_TYPE_LABELS[rule.eventType];
        return (
          <TabButton
            key={rule.id}
            active={selected === rule.id}
            onClick={() => onSelect(rule.id)}
            icon={EVENT_ICON[rule.eventType]}
            label={label}
          />
        );
      })}
    </div>
  );
}
