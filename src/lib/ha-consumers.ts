import type { HassEntity } from "./ha";
import type { DailyUsage } from "./ha-insights";

export function consumerMeters(states: Record<string, HassEntity>) {
  return Object.values(states).filter((e) => e.entity_id.startsWith("sensor.") && !e.attributes.hidden &&
    ["Wh", "kWh", "MWh"].includes(e.attributes.unit_of_measurement) &&
    ["total", "total_increasing"].includes(e.attributes.state_class))
    .sort((a, b) => String(a.attributes.friendly_name ?? a.entity_id).localeCompare(String(b.attributes.friendly_name ?? b.entity_id), "de"));
}

export function rankConsumers(ids: string[], usage: Record<string, DailyUsage[]>) {
  return [...new Set(ids)].map((id) => {
    const values = (usage[id] ?? []).flatMap((day) => day.kwh != null && Number.isFinite(day.kwh) && day.kwh >= 0 ? [day.kwh] : []);
    return { id, days: values.length, kwh: values.length === 7 ? values.reduce((sum, value) => sum + value, 0) : null };
  }).sort((a, b) => (b.kwh ?? -1) - (a.kwh ?? -1));
}