import type { HassEntity } from "./ha";

export type EntityRegistryEntry = {
  entity_id: string;
  device_id?: string | null;
  entity_category?: string | null;
  hidden_by?: string | null;
  disabled_by?: string | null;
};

export function dashboardDevices(states: Record<string, HassEntity>, registry: EntityRegistryEntry[]) {
  const entries = new Map(registry.map(e => [e.entity_id, e]));
  const visible = Object.values(states).filter(e => {
    const entry = entries.get(e.entity_id);
    return !e.attributes.hidden && !entry?.hidden_by && !entry?.disabled_by;
  });
  const covers = visible.filter(e => e.entity_id.startsWith("cover."));
  const coverDevices = new Set(covers.map(e => entries.get(e.entity_id)?.device_id).filter(Boolean));
  const coverNames = new Set(covers.map(e => e.entity_id.split(".")[1]?.toLowerCase()));
  const lights = visible.filter(e => {
    if (!/^(light|switch)\./.test(e.entity_id)) return false;
    const entry = entries.get(e.entity_id);
    if (entry?.entity_category || /aioshelly_ble_integration/i.test(e.entity_id + " " + (e.attributes.friendly_name ?? ""))) return false;
    if (e.entity_id.startsWith("switch.")) {
      if (entry?.device_id && coverDevices.has(entry.device_id)) return false;
      if (coverNames.has(e.entity_id.split(".")[1]?.toLowerCase())) return false;
    }
    return true;
  });
  return { lights, covers, cameras: visible.filter(e => e.entity_id.startsWith("camera.")) };
}