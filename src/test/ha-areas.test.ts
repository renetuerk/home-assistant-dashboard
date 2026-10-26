import { describe, expect, it } from "vitest";
import { buildAreaMap } from "@/lib/ha";

describe("Room assignment", () => {
  it("uses the entity's own room, else its device's room", () => {
    const m = buildAreaMap(
      [{ area_id: "k", name: "Küche" }, { area_id: "w", name: "Wohnzimmer" }],
      [{ id: "d1", area_id: "k" }],
      [{ entity_id: "light.a", device_id: "d1" }, { entity_id: "light.b", device_id: "d1", area_id: "w" }, { entity_id: "light.c" }],
    );
    expect(m).toEqual({ "light.a": "Küche", "light.b": "Wohnzimmer" });
  });
});
