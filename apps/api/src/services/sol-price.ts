/**
 * Cached SOL→USD price so webhook events can carry a usdValue (which `minUsd`
 * rules match on). Best-effort: on any failure we return the last good price, or
 * null — events then have a null usdValue, which simply won't match minUsd rules.
 */
let cached: { usd: number; at: number } | null = null;
const TTL_MS = 60_000;

export async function getSolPriceUsd(now: number = Date.now()): Promise<number | null> {
  if (cached && now - cached.at < TTL_MS) return cached.usd;
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      { signal: AbortSignal.timeout(4000) },
    );
    if (!res.ok) return cached?.usd ?? null;
    const data = (await res.json()) as { solana?: { usd?: number } };
    const usd = data.solana?.usd;
    if (typeof usd === "number" && usd > 0) {
      cached = { usd, at: now };
      return usd;
    }
    return cached?.usd ?? null;
  } catch {
    return cached?.usd ?? null;
  }
}
