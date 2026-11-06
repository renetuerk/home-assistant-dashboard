import { describe, expect, it } from "vitest";
import { defaultLayout, moveWidget, normalizeLayout, shiftWidget, toggleFavorite, toggleHidden } from "@/lib/dashboard-layout";
import { newAlerts } from "@/lib/ha-alerts";
import type { HassEntity } from "@/lib/ha";

const ent = (entity_id: string, state: string, attributes: Record<string, any> = {}): HassEntity =>
  ({ entity_id, state, attributes, last_changed: "", last_updated: "" }) as HassEntity;

describe("dashboard layout", () => {
  it("repairs stale or invalid stored layouts", () => {
    const l = normalizeLayout({ main: ["weather", "weather", "bogus"], side: [], hidden: ["energy"], favorites: ["light.a", "light.a", 3] });
    expect(l.main[0]).toBe("weather");
    expect([...l.main, ...l.side].sort()).toEqual([...defaultLayout().main, ...defaultLayout().side].sort());
    expect(l.favorites).toEqual(["light.a"]);
    expect(l.hidden).toEqual(["energy"]);
  });

  it("moves between columns and shifts within one", () => {
    const moved = moveWidget(defaultLayout(), "weather", "main", 0);
    expect(moved.main[0]).toBe("weather");
    expect(moved.side).not.toContain("weather");
    expect(shiftWidget(moved, "weather", -1)).toBe(moved);
    expect(shiftWidget(moved, "weather", 1).main[1]).toBe("weather");
  });

  it("toggles hidden and favorites", () => {
    expect(toggleHidden(toggleHidden(defaultLayout(), "energy"), "energy").hidden).toEqual([]);
    expect(toggleFavorite(defaultLayout(), "light.a").favorites).toEqual(["light.a"]);
  });
});

describe("alerts", () => {
  it("only reports transitions into alarm", () => {
    const off = { "binary_sensor.rauch": ent("binary_sensor.rauch", "off", { device_class: "smoke" }) };
    const on = { "binary_sensor.rauch": ent("binary_sensor.rauch", "on", { device_class: "smoke" }) };
    expect(newAlerts(null, on)).toEqual([]);
    expect(newAlerts(off, on)).toHaveLength(1);
    expect(newAlerts(on, on)).toEqual([]);
  });
});
