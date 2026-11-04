import { describe, expect, it } from "vitest";
import { dailyUsage, energyWindow, forecastPoints } from "@/lib/ha-insights";

describe("seven-day household consumption", () => {
  const now = new Date(2026, 10, 1, 10);
  it("includes exactly seven completed calendar days, excluding today", () => {
    const window = energyWindow(now);
    expect(window.days).toHaveLength(7);
    expect(new Date(window.days[0] ?? 0).getDate()).toBe(25);
    expect(new Date(window.days[6] ?? 0).getDate()).toBe(31);
    expect(window.end.getDate()).toBe(1);
  });
  it("uses recorder consumption changes, not absolute meter readings", () => {
    const start = energyWindow(now).days[0] ?? 0;
    expect(dailyUsage([{ start, change: 9.8 }], now)[0]?.kwh).toBe(9.8);
  });
  it("leaves missing and invalid days unknown rather than inventing zero usage", () => {
    const days = energyWindow(now).days;
    const result = dailyUsage([{ start: days[0] ?? 0, change: -2 }, { start: days[1] ?? 0, change: null }, { start: days[2] ?? 0, change: 0 }], now);
    expect(result.map((day) => day.kwh)).toEqual([null, null, 0, null, null, null, null]);
  });
  it("accepts both ISO and Unix-second timestamps", () => {
    const start = energyWindow(now).days[0] ?? 0;
    expect(dailyUsage([{ start: new Date(start).toISOString(), change: 12.1 }], now)[0]?.kwh).toBe(12.1);
    expect(dailyUsage([{ start: start / 1000, change: 12.1 }], now)[0]?.kwh).toBe(12.1);
  });
  it("loads fourteen completed calendar days for adjacent seven-day comparisons", () => {
    const window = energyWindow(now, 14);
    expect(window.days).toHaveLength(14);
    expect(window.start).toEqual(new Date(2026, 9, 18));
    expect(window.days[7]).toBe(new Date(2026, 9, 25).getTime());
    expect(window.end).toEqual(new Date(2026, 10, 1));
    const parsed = dailyUsage(window.days.map(start => ({ start, change: 2 })), now, 14);
    expect(parsed).toHaveLength(14);
    expect(parsed.map(day => day.kwh)).toEqual(Array(14).fill(2));
  });
});

describe("weather forecast", () => {
  it("preserves provider temperatures, discards invalid entries and sorts by date", () => {
    expect(forecastPoints([{ datetime: "invalid", temperature: 1 }, { datetime: "2026-11-03T12:00:00Z", temperature: 17, condition: "sunny" }, { datetime: "2026-11-02T12:00:00Z", temperature: 13, templow: 8, condition: "rainy" }])).toEqual([
      { datetime: "2026-11-02T12:00:00Z", temperature: 13, templow: 8, condition: "rainy" },
      { datetime: "2026-11-03T12:00:00Z", temperature: 17, condition: "sunny" },
    ]);
  });
});