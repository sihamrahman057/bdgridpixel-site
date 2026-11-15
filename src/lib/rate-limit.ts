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

export function clientIp(headerList: { get(name: string): string | null }) {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim().slice(0, 80) || "local";
  return headerList.get("x-real-ip")?.trim().slice(0, 80) || "local";
}
