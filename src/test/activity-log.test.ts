import { describe, expect, it } from "vitest";
import { buildActivityLog, MAX_LOG_LINES } from "@/lib/activity-log";

const states = { "binary_sensor.tuer": { entity_id: "binary_sensor.tuer", state: "off", attributes: { friendly_name: "Haustür" } } };

describe("activity log for AI summary", () => {
  it("lists only real state changes in time order", () => {
    const log = buildActivityLog({ "binary_sensor.tuer": [
      { t: Date.UTC(2026, 0, 1, 9, 0), s: "off" }, { t: Date.UTC(2026, 0, 1, 8, 0), s: "on" }, { t: Date.UTC(2026, 0, 1, 9, 5), s: "off" },
    ] }, states, "UTC");
    expect(log).toEqual(["08:00 Haustür: on", "09:00 Haustür: off"]);
  });
  it("caps the log at the newest entries", () => {
    const points = Array.from({ length: 400 }, (_, i) => ({ t: i * 60_000, s: String(i) }));
    const log = buildActivityLog({ "sensor.x": points }, {}, "UTC");
    expect(log).toHaveLength(MAX_LOG_LINES);
    expect(log.at(-1)).toContain("sensor.x: 399");
  });
});
