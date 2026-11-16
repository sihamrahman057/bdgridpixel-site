const hits = new Map<string, number[]>();

export function takeToken(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

export function resetRateLimit() {
  hits.clear();
}

/**
 * Client IP for throttling. Prefer proxy-set x-real-ip; if using
 * x-forwarded-for, take the last hop (added by the trusted edge), not the
 * first value a client can spoof.
 */
export function clientIp(headerList: { get(name: string): string | null }) {
  const real = headerList.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 80);

  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const edge = parts.at(-1);
    if (edge) return edge.slice(0, 80);
  }

  return "local";
}
