import type { HassEntity } from "./ha";

export type CameraArmingStatus = "armed" | "disarmed" | "arming" | "pending" | "triggered" | "unknown";

export function cameraArmingCandidates(states: Record<string, HassEntity>) {
  return Object.values(states).filter(e => /^(alarm_control_panel|switch|binary_sensor|input_boolean|sensor)\./.test(e.entity_id) && !e.attributes.hidden);
}

export function cameraArmingEntity(states: Record<string, HassEntity>, selected?: string) {
  if (selected) return states[selected];
  // Only camera-specific alarm panels are unambiguous enough for auto-discovery.
  const matches = cameraArmingCandidates(states).filter(e => e.entity_id.startsWith("alarm_control_panel.") && /kamera|camera/i.test(`${e.entity_id} ${e.attributes.friendly_name ?? ""}`));
  return matches.length === 1 ? matches[0] : undefined;
}

export function cameraArmingStatus(entity?: HassEntity): CameraArmingStatus {
  if (!entity) return "unknown";
  const state = entity.state;
  if (["armed_home", "armed_away", "armed_night", "armed_vacation", "armed_custom_bypass", "armed"].includes(state)) return "armed";
  if (state === "disarmed") return "disarmed";
  if (["arming", "pending", "triggered"].includes(state)) return state as "arming" | "pending" | "triggered";
  if (/^(switch|binary_sensor|input_boolean)\./.test(entity.entity_id)) {
    if (state === "on") return "armed";
    if (state === "off") return "disarmed";
  }
  return "unknown";
}