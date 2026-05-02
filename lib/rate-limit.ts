/**
 * הגבלת קצב פשוטה בזיכרון (מופע שרת יחיד). מתאים ל־GET ציבוריים.
 */
type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();

export function rateLimitResponse(
  key: string,
  opts: { windowMs: number; max: number }
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now - b.windowStart > opts.windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { ok: true };
  }
  b.count += 1;
  if (b.count > opts.max) {
    const retryAfterSec = Math.ceil((opts.windowMs - (now - b.windowStart)) / 1000);
    return { ok: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }
  return { ok: true };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  return (forwarded.split(",")[0] || request.headers.get("x-real-ip") || "unknown").trim();
}
