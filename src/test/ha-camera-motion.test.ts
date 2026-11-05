import { describe, expect, it } from "vitest";
import { cameraMotionCandidates, cameraMotionEntity, cameraMotionStatus } from "@/lib/ha-camera-motion";
import type { HassEntity } from "@/lib/ha";

const entity = (entity_id: string, state: string, attributes = {}): HassEntity => ({ entity_id, state, attributes });
describe("Camera motion", () => {
  it("reads motion on and no motion off from the binary sensor", () => {
    expect(cameraMotionStatus(entity("binary_sensor.kamera_bewegung", "on"))).toBe("motion");
    expect(cameraMotionStatus(entity("binary_sensor.kamera_bewegung", "off"))).toBe("clear");
  });
  it("never substitutes camera streaming or alarm arming for motion", () => {
    expect(cameraMotionStatus(entity("camera.eingang", "idle"))).toBe("unknown");
    expect(cameraMotionStatus(entity("alarm_control_panel.kameras", "armed_away"))).toBe("unknown");
    expect(cameraMotionStatus(entity("switch.kameras", "on"))).toBe("unknown");
  });
  it("keeps absent and unavailable readings unknown", () => {
    expect(cameraMotionStatus()).toBe("unknown");
    for (const state of ["unavailable", "unknown"]) expect(cameraMotionStatus(entity("binary_sensor.kamera_bewegung", state))).toBe("unknown");
  });
  it("auto-detects only a unique camera motion sensor", () => {
    const camera = entity("binary_sensor.kamera_bewegung", "off", { device_class: "motion" });
    const hall = entity("binary_sensor.flur", "on", { device_class: "motion" });
    const states = { [camera.entity_id]: camera, [hall.entity_id]: hall };
    expect(cameraMotionEntity(states)).toBe(camera);
    expect(cameraMotionEntity({ [hall.entity_id]: hall })).toBeUndefined();
    const other = entity("binary_sensor.camera_motion", "off");
    expect(cameraMotionEntity({ ...states, [other.entity_id]: other })).toBeUndefined();
    expect(cameraMotionEntity(states, hall.entity_id)).toBe(hall);
    expect(cameraMotionEntity(states, "binary_sensor.missing")).toBeUndefined();
  });
  it("offers motion sensors, not unrelated camera door or alarm entities", () => {
    const motion = entity("binary_sensor.eingang", "off", { device_class: "motion" });
    const door = entity("binary_sensor.camera_door", "off", { device_class: "door" });
    expect(cameraMotionCandidates({ [motion.entity_id]: motion, [door.entity_id]: door })).toEqual([motion]);
  });
});