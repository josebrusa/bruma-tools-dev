import { describe, expect, it, vi } from "vitest";
import { MinuteWindowLimiter } from "./rate-limit-window.js";

describe("MinuteWindowLimiter", () => {
  it("allows burst within limit", () => {
    const lim = new MinuteWindowLimiter(3, 60_000);
    expect(lim.consume("a")).toEqual({ ok: true });
    expect(lim.consume("a")).toEqual({ ok: true });
    expect(lim.consume("a")).toEqual({ ok: true });
  });

  it("blocks after limit until window rolls", () => {
    vi.useFakeTimers();
    const lim = new MinuteWindowLimiter(2, 60_000);
    expect(lim.consume("k")).toEqual({ ok: true });
    expect(lim.consume("k")).toEqual({ ok: true });
    const blocked = lim.consume("k");
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    }
    vi.advanceTimersByTime(61_000);
    expect(lim.consume("k")).toEqual({ ok: true });
    vi.useRealTimers();
  });

  it("disables when limit is zero", () => {
    const lim = new MinuteWindowLimiter(0, 60_000);
    for (let i = 0; i < 10; i++) {
      expect(lim.consume("x")).toEqual({ ok: true });
    }
  });
});
