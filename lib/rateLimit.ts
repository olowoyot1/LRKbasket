// Simple in-memory rate limiter, scoped per serverless instance.
//
// This stops casual/scripted brute-forcing of ADMIN_PASSWORD, but it is NOT
// a durable, cross-instance limit: Vercel can run multiple instances of a
// function concurrently, each with its own memory, and this map resets on
// cold start. For stronger guarantees at scale, swap this for Vercel's
// Firewall rate limiting or an Upstash Redis-backed limiter - the call site
// (app/api/admin/login/route.ts) is the only place that would need to change.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true };
}

/** Call after a successful login to clear the counter for that key. */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

// Occasionally sweep expired entries so the map doesn't grow unbounded
// across a long-lived serverless instance.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, WINDOW_MS).unref?.();
