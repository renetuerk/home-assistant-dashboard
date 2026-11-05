import type { HassEntity } from "./ha";

export function cameraMotionCandidates(states: Record<string, HassEntity>) {
  return Object.values(states).filter(e => e.entity_id.startsWith("binary_sensor.") && !e.attributes.hidden && (e.attributes.device_class === "motion" || /bewegung|motion/i.test(`${e.entity_id} ${e.attributes.friendly_name ?? ""}`)));
}

export function cameraMotionEntity(states: Record<string, HassEntity>, selected?: string) {
  if (selected) return states[selected];
  const matches = cameraMotionCandidates(states).filter(e => /kamera|camera/i.test(`${e.entity_id} ${e.attributes.friendly_name ?? ""}`));
  return matches.length === 1 ? matches[0] : undefined;
}

export function cameraMotionStatus(entity?: HassEntity): "motion" | "clear" | "unknown" {
  if (!entity?.entity_id.startsWith("binary_sensor.")) return "unknown";
  if (entity.state === "on") return "motion";
  if (entity.state === "off") return "clear";
  return "unknown";
}