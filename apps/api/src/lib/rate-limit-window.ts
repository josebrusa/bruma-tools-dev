type Bucket = { count: number; windowStart: number };

/** Sliding window counter per key (in-memory; scale-out needs shared store). */
export class MinuteWindowLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  consume(key: string): { ok: true } | { ok: false; retryAfterSec: number } {
    if (this.limit <= 0) return { ok: true };
    const now = Date.now();
    const w = this.windowMs;
    let b = this.buckets.get(key);
    if (!b || now - b.windowStart >= w) {
      b = { count: 0, windowStart: now };
      this.buckets.set(key, b);
    }
    if (b.count >= this.limit) {
      const retryAfterSec = Math.ceil((w - (now - b.windowStart)) / 1000);
      return { ok: false, retryAfterSec: Math.max(1, retryAfterSec) };
    }
    b.count += 1;
    return { ok: true };
  }
}
