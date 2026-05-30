"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { type Alert, alertSchema } from "@sentinel/shared";
import { apiFetch } from "@/lib/api";

interface AlertsResponse {
  alerts: unknown[];
  nextCursor: string | null;
}

/** Alert history (most recent first) for the signed-in user. */
export function useAlerts() {
  const { data: session } = useSession();
  const token = session?.apiToken;
  return useQuery<Alert[]>({
    queryKey: ["alerts"],
    enabled: Boolean(token),
    queryFn: async () => {
      const data = await apiFetch<AlertsResponse>("/alerts?limit=100", { token });
      // Zod validates the shape; `raw: unknown` is optional in Zod's inference
      // but required in the generated type, so assert to the shared Alert.
      return data.alerts.map((a) => alertSchema.parse(a) as Alert);
    },
  });
}
