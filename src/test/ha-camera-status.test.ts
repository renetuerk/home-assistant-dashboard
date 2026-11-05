import { describe, expect, it } from "vitest";
import { cameraArmingEntity, cameraArmingStatus } from "@/lib/ha-camera-status";
import type { HassEntity } from "@/lib/ha";

const entity = (entity_id: string, state: string): HassEntity => ({ entity_id, state, attributes: {} });
describe("Camera arming status", () => {
  it("recognizes every Home Assistant armed mode", () => {
    for (const state of ["armed_home", "armed_away", "armed_night", "armed_vacation", "armed_custom_bypass"]) {
      expect(cameraArmingStatus(entity("alarm_control_panel.kameras", state))).toBe("armed");
    }
  });
  it("distinguishes disarmed, transitions and triggered alarms", () => {
    for (const state of ["disarmed", "arming", "pending", "triggered"] as const) {
      expect(cameraArmingStatus(entity("alarm_control_panel.kameras", state))).toBe(state);
    }
  });
  it("uses on/off only for explicitly selected boolean entities, never camera idle", () => {
    expect(cameraArmingStatus(entity("switch.kameras_scharf", "on"))).toBe("armed");
    expect(cameraArmingStatus(entity("switch.kameras_scharf", "off"))).toBe("disarmed");
    expect(cameraArmingStatus(entity("camera.eingang", "idle"))).toBe("unknown");
    expect(cameraArmingStatus(entity("sensor.kamera", "on"))).toBe("unknown");
  });
  it("does not confuse missing or unavailable data with disarmed", () => {
    expect(cameraArmingStatus()).toBe("unknown");
    expect(cameraArmingStatus(entity("switch.kameras", "unavailable"))).toBe("unknown");
  });
  it("auto-selects only one camera-specific alarm, with explicit selection taking precedence", () => {
    const general = entity("alarm_control_panel.haus", "armed_away");
    const cameras = entity("alarm_control_panel.kameras", "disarmed");
    const states = { [general.entity_id]: general, [cameras.entity_id]: cameras };
    expect(cameraArmingEntity({ [general.entity_id]: general })).toBeUndefined();
    expect(cameraArmingEntity(states)).toBe(cameras);
    expect(cameraArmingEntity(states, general.entity_id)).toBe(general);
    expect(cameraArmingEntity(states, "switch.missing")).toBeUndefined();
    const other = entity("alarm_control_panel.camera_garten", "disarmed");
    expect(cameraArmingEntity({ ...states, [other.entity_id]: other })).toBeUndefined();
  });
});