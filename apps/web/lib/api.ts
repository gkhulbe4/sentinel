import { API_URL } from "./config";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
}

/** Typed fetch against the Sentinel API. Throws `ApiError` on non-2xx. */
export async function apiFetch<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  // Only declare a JSON content-type when we actually send a body — Fastify
  // rejects an application/json request with an empty body (e.g. bodyless
  // POST /alerts/:id/enrich or DELETE /rules/:id).
  const hasBody = opts.body !== undefined;
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      ...(hasBody ? { "content-type": "application/json" } : {}),
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    body: hasBody ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      error?: { code?: string; message?: string };
    } | null;
    throw new ApiError(res.status, data?.error?.code ?? "ERROR", data?.error?.message ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
