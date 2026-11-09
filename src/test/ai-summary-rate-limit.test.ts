import { describe, expect, it } from "vitest";
import { isActivitySummaryAllowed } from "@/lib/ai-summary-rate-limit.server";

describe("activity summary rate limit", () => {
  it("allows five requests per client per minute", () => {
    const headers = new Headers({ "x-real-ip": `test-${Math.random()}` });
    const now = Date.now();

    for (let i = 0; i < 5; i++) {
      expect(isActivitySummaryAllowed(headers, now)).toBe(true);
    }
    expect(isActivitySummaryAllowed(headers, now)).toBe(false);
  });

  it("resets the limit after one minute and separates clients", () => {
    const now = Date.now();
    const id = Math.random();
    const clientA = new Headers({ "x-forwarded-for": `test-${id}, 198.51.100.1` });
    const clientB = new Headers({ "x-forwarded-for": `test-${id}-other` });

    for (let i = 0; i < 5; i++) {
      expect(isActivitySummaryAllowed(clientA, now)).toBe(true);
    }
    expect(isActivitySummaryAllowed(clientA, now)).toBe(false);
    expect(isActivitySummaryAllowed(clientB, now)).toBe(true);
    expect(isActivitySummaryAllowed(clientA, now + 60_000)).toBe(true);
  });
});
