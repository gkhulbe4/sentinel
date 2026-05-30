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
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: opts.signal,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      error?: { code?: string; message?: string };
    } | null;
    throw new ApiError(res.status, data?.error?.code ?? "ERROR", data?.error?.message ?? res.statusText);
  }
  return (await res.json()) as T;
}
