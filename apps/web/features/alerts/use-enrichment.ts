"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { type Enrichment, enrichmentSchema } from "@sentinel/shared";
import { apiFetch } from "@/lib/api";

/**
 * Fetches the AI analysis for a single alert on demand (when `enabled`, i.e. the
 * dialog is open). The API computes it on first call and caches it, so re-opening
 * an alert is cheap and the result never goes stale.
 */
export function useAlertEnrichment(alertId: string, enabled: boolean) {
  const { data: session } = useSession();
  const token = session?.apiToken;
  return useQuery<Enrichment>({
    queryKey: ["enrichment", alertId],
    enabled: enabled && Boolean(token),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    queryFn: async () => {
      const data = await apiFetch<unknown>(`/alerts/${alertId}/enrich`, { method: "POST", token });
      return enrichmentSchema.parse(data);
    },
  });
}
