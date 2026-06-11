import "server-only";

/**
 * Lightweight fixed-window rate limiter.
 *
 * In-memory by default — fine for a single long-running instance, but on
 * serverless (Vercel) each lambda has its own memory, so limits are per-instance.
 * For production-grade limiting across instances, back this with Upstash Redis
 * (swap the Map for INCR+EXPIRE); the call sites don't change.
 */
type Entry = { count: number; resetAt: number };

const globalForRl = globalThis as unknown as { __urRl?: Map<string, Entry> };
const store = globalForRl.__urRl ?? new Map<string, Entry>();
globalForRl.__urRl = store;

export type RateResult = { ok: true } | { ok: false; retryAfter: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  const e = store.get(key);
  if (!e || e.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (e.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((e.resetAt - now) / 1000) };
  }
  e.count += 1;
  return { ok: true };
}

// Best-effort client IP from common proxy headers (Vercel sets x-forwarded-for).
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export function tooMany(retryAfter: number): Response {
  return new Response(JSON.stringify({ error: "Too many requests. Please slow down." }), {
    status: 429,
    headers: { "content-type": "application/json", "retry-after": String(retryAfter) },
  });
}
