import { describe, expect, it } from "vitest";
import { DEFAULT_ENERGY_PRICE, energyCost, formatEuro } from "@/lib/energy-costs";

describe("energyCost", () => {
  it("multiplies consumption with the configured price", () => {
    expect(energyCost(7.4, 0.3)).toBeCloseTo(2.22);
    expect(energyCost(182.5, 0.35)).toBeCloseTo(63.875);
  });

  it("is zero without consumption", () => {
    expect(energyCost(0, DEFAULT_ENERGY_PRICE)).toBe(0);
  });
});

describe("formatEuro", () => {
  it("formats German currency", () => {
    expect(formatEuro(2.22)).toContain("2,22");
    expect(formatEuro(2.22)).toContain("€");
  });
});
