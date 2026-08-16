export interface RateLimiterOptions {
  windowMs: number;
  max: number;
}

export interface RateLimiter {
  check(key: string): boolean;
}

// In-memory fixed-window limiter — no external infra, same reasoning tech.md already
// uses for running node-cron in-process instead of a separate worker/queue.
export function createRateLimiter({ windowMs, max }: RateLimiterOptions): RateLimiter {
  const hits = new Map<string, { count: number; windowStart: number }>();

  return {
    check(key: string): boolean {
      const now = Date.now();
      const entry = hits.get(key);

      if (!entry || now - entry.windowStart >= windowMs) {
        hits.set(key, { count: 1, windowStart: now });
        return true;
      }

      if (entry.count >= max) {
        return false;
      }

      entry.count += 1;
      return true;
    },
  };
}
