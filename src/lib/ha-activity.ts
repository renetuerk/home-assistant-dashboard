import type { HassEntity } from "./ha";

export function activityOf(e: HassEntity): "active" | "inactive" | "unknown" {
  if (["unknown", "unavailable"].includes(e.state)) return "unknown";
  const domain = e.entity_id.split(".")[0];
  if (domain === "climate") {
    if (e.state === "off") return "inactive";
    const action = e.attributes.hvac_action;
    if (action) return ["heating", "cooling", "drying", "fan", "preheating", "defrosting"].includes(action) ? "active" : "inactive";
    return "active";
  }
  if (domain === "lock") return e.state === "locked" ? "inactive" : "active";
  if (domain === "alarm_control_panel") return e.state === "disarmed" ? "inactive" : "active";
  return e.state === "on" ? "active" : e.state === "off" ? "inactive" : "unknown";
}