import { describe, expect, it } from "vitest";
import { dashboardDevices } from "@/lib/ha-devices";
import type { HassEntity } from "@/lib/ha";

const e = (entity_id: string, state = "off"): HassEntity => ({ entity_id, state, attributes: {} });
const states = (...entities: HassEntity[]) => Object.fromEntries(entities.map(e => [e.entity_id, e]));
describe("Dashboard device selection", () => {
  it("excludes aioshelly_ble_integration but keeps regular Shelly switches", () => {
    expect(dashboardDevices(states(e("switch.shelly_aioshelly_ble_integration"), e("switch.shelly_kueche")), []).lights.map(e => e.entity_id)).toEqual(["switch.shelly_kueche"]);
  });
  it("excludes diagnostic and configuration switches", () => {
    expect(dashboardDevices(states(e("switch.bluetooth"), e("switch.diagnostic")), [{ entity_id: "switch.bluetooth", entity_category: "config" }, { entity_id: "switch.diagnostic", entity_category: "diagnostic" }]).lights).toEqual([]);
  });
  it("prefers a cover over the switch on the same device even with different names", () => {
    const result = dashboardDevices(states(e("cover.Smart_garage", "closed"), e("switch.smart_relay"), e("switch.kueche")), [{ entity_id: "cover.Smart_garage", device_id: "garage" }, { entity_id: "switch.smart_relay", device_id: "garage" }]);
    expect(result.covers.map(e => e.entity_id)).toEqual(["cover.Smart_garage"]);
    expect(result.lights.map(e => e.entity_id)).toEqual(["switch.kueche"]);
  });
  it("prefers a matching cover when device metadata is absent", () => {
    expect(dashboardDevices(states(e("cover.Smart", "open"), e("switch.smart")), []).lights).toEqual([]);
  });
  it("keeps on-demand and unavailable cameras visible without a four-camera limit", () => {
    const result = dashboardDevices(states(...Array.from({ length: 6 }, (_, i) => e(`camera.cam_${i}`, i === 0 ? "unavailable" : "idle"))), []);
    expect(result.cameras).toHaveLength(6);
    expect(result.cameras[0]?.state).toBe("unavailable");
  });
});