"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  type CreateRuleInput,
  type RuleDto,
  type UpdateRuleInput,
  ruleDtoSchema,
} from "@sentinel/shared";
import { apiFetch } from "@/lib/api";

const KEY = ["rules"] as const;

export function useWatchRules() {
  const { data: session } = useSession();
  const token = session?.apiToken;
  const qc = useQueryClient();

  const query = useQuery<RuleDto[]>({
    queryKey: KEY,
    enabled: Boolean(token),
    queryFn: async () => {
      const data = await apiFetch<{ rules: unknown[] }>("/rules", { token });
      return data.rules.map((r) => ruleDtoSchema.parse(r));
    },
  });

  const create = useMutation({
    mutationFn: (input: CreateRuleInput) =>
      apiFetch<{ rule: RuleDto }>("/rules", { method: "POST", body: input, token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRuleInput }) =>
      apiFetch<{ rule: RuleDto }>(`/rules/${id}`, { method: "PATCH", body: input, token }),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<RuleDto[]>(KEY);
      qc.setQueryData<RuleDto[]>(KEY, (old) =>
        old?.map((r) => (r.id === id ? { ...r, ...input } : r)),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/rules/${id}`, { method: "DELETE", token }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<RuleDto[]>(KEY);
      qc.setQueryData<RuleDto[]>(KEY, (old) => old?.filter((r) => r.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  return { query, create, update, remove };
}
