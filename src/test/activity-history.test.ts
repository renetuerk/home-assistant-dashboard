import { describe, expect, it } from "vitest";
import { demoStateHistory, parseStateHistory } from "@/lib/activity-history";
import { summaryInputSchema } from "@/lib/ai-summary-input";

describe("selected activity history", () => {
  it("only returns selected entities and preserves binary changes", () => {
    expect(parseStateHistory({ "binary_sensor.window": [{ s: "off", lu: 1 }, { s: "on", lu: 3 }], "sensor.private": [{ s: "secret", lu: 2 }] }, ["binary_sensor.window"], 1000, 4000))
      .toEqual({ "binary_sensor.window": [{ t: 1000, s: "off" }, { t: 3000, s: "on" }] });
  });
  it("uses state-change time and retains initial context at window start", () => {
    expect(parseStateHistory({ x: [{ s: "off", lc: 1, lu: 5 }, { s: "on", lu: 4 }, { s: "off", lu: 9 }] }, ["x"], 2000, 6000))
      .toEqual({ x: [{ t: 2000, s: "off" }, { t: 4000, s: "on" }] });
  });
  it("does not turn failed history into an empty successful log", () => {
    expect(() => parseStateHistory(null, ["x"], 0, 1)).toThrow();
    expect(parseStateHistory({}, ["x"], 0, 1)).toEqual({ x: [] });
  });
  it("keeps demo events within every selected window, even with many sensors", () => {
    const states = Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`binary_sensor.${i}`, { state: "off" }]));
    const now = 100_000_000;
    for (const hours of [1, 3, 6, 12, 24]) {
      const points = Object.values(demoStateHistory(Object.keys(states), states, hours, now)).flat();
      expect(points).toHaveLength(100);
      expect(points.every(p => p.t >= now - hours * 3600_000 && p.t <= now)).toBe(true);
    }
  });
});

describe("summary boundaries", () => {
  it("accepts the five supported periods and rejects others", () => {
    for (const hours of [1, 3, 6, 12, 24]) expect(summaryInputSchema.safeParse({ log: ["Fenster: on"], hours }).success).toBe(true);
    expect(summaryInputSchema.safeParse({ log: [], hours: 48 }).success).toBe(false);
  });
  it("accepts 300 entries but rejects 301", () => {
    expect(summaryInputSchema.safeParse({ log: Array(300).fill("x"), hours: 6 }).success).toBe(true);
    expect(summaryInputSchema.safeParse({ log: Array(301).fill("x"), hours: 6 }).success).toBe(false);
  });
  it("rejects entries longer than 200 characters", () => {
    expect(summaryInputSchema.safeParse({ log: ["x".repeat(200)], hours: 6 }).success).toBe(true);
    expect(summaryInputSchema.safeParse({ log: ["x".repeat(201)], hours: 6 }).success).toBe(false);
  });
});