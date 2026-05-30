"use client";

import { type FormEvent, useState } from "react";
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  type EventType,
  createRuleSchema,
} from "@sentinel/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import { WalletInput } from "./wallet-input";
import { useWatchRules } from "./use-watch-rules";

export function RuleForm() {
  const { create } = useWatchRules();
  const [eventType, setEventType] = useState<EventType>("TOKEN_SWAP");
  const [walletAddr, setWalletAddr] = useState("");
  const [minUsd, setMinUsd] = useState("");
  const [error, setError] = useState<string | null>(null);

  const walletRequired = eventType === "WALLET_ACTIVITY";

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = createRuleSchema.safeParse({
      eventType,
      walletAddr: walletAddr || undefined,
      minUsd: minUsd ? Number(minUsd) : undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid rule");
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: () => {
        setWalletAddr("");
        setMinUsd("");
      },
      onError: (err) =>
        setError(err instanceof ApiError ? err.message : "Failed to create rule"),
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="eventType">Event type</Label>
        <Select
          id="eventType"
          value={eventType}
          onChange={(e) => setEventType(e.target.value as EventType)}
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {EVENT_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
      </div>

      <WalletInput value={walletAddr} onChange={setWalletAddr} required={walletRequired} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="minUsd">Min USD value (optional)</Label>
        <Input
          id="minUsd"
          type="number"
          min="0"
          step="any"
          placeholder="e.g. 5000"
          value={minUsd}
          onChange={(e) => setMinUsd(e.target.value)}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={create.isPending}>
        {create.isPending ? "Adding…" : "Add rule"}
      </Button>
    </form>
  );
}
