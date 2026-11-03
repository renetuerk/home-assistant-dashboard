import { describe, expect, it } from "vitest";
import { consumerMeters, rankConsumers } from "@/lib/ha-consumers";
import { energyCost } from "@/lib/energy-costs";

describe("largest electricity consumers", () => {
  const days = (kwh: number | null) => Array.from({ length: 7 }, (_, start) => ({ start, kwh }));
  it("ranks seven completed daily changes rather than current meter readings", () => {
    expect(rankConsumers(["dryer", "pump"], { dryer: days(2), pump: days(3) })).toEqual([
      { id: "pump", days: 7, kwh: 21 }, { id: "dryer", days: 7, kwh: 14 },
    ]);
  });
  it("does not rank partial data as a complete week's consumption", () => {
    expect(rankConsumers(["partial", "zero"], { partial: [...days(10).slice(0, 6), { start: 6, kwh: null }], zero: days(0) })).toEqual([
      { id: "zero", days: 7, kwh: 0 }, { id: "partial", days: 6, kwh: null },
    ]);
  });
  it("deduplicates selected meters", () => {
    expect(rankConsumers(["pump", "pump"], { pump: days(3) })).toHaveLength(1);
  });
  it("requires an energy unit and recorder-compatible state class, not watts", () => {
    const make = (unit: string, state_class: string) => ({ entity_id: `sensor.${unit}`, state: "1234", attributes: { unit_of_measurement: unit, state_class } });
    expect(consumerMeters({ a: make("kWh", "total_increasing"), b: make("W", "measurement"), c: make("Wh", "total") }).map(e => e.entity_id).sort()).toEqual(["sensor.Wh", "sensor.kWh"]);
  });
  it("uses the configured price for the seven-day cost", () => {
    expect(energyCost(21, 0.4)).toBeCloseTo(8.4);
  });
});