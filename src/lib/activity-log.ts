import type { HassEntity } from "./ha";

const KEY = "ha-dashboard-ai-sensors";
export const MAX_LOG_LINES = 300;

export function loadAiSensors(): string[] {
  if (typeof window === "undefined") return [];
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []; } catch { return []; }
}
export function saveAiSensors(ids: string[]) { localStorage.setItem(KEY, JSON.stringify(ids)); }

/** Chronological, compact log of state changes (only actual changes, newest kept when capped). */
export function buildActivityLog(
  history: Record<string, { t: number; s: string }[]>,
  states: Record<string, HassEntity>,
  timeZone?: string,
): string[] {
  const rows: { t: number; line: string }[] = [];
  const fmt = new Intl.DateTimeFormat("de-AT", { hour: "2-digit", minute: "2-digit", timeZone });
  for (const [id, points] of Object.entries(history)) {
    const e = states[id];
    const name = String(e?.attributes.friendly_name ?? id);
    const unit = e?.attributes.unit_of_measurement ? ` ${e.attributes.unit_of_measurement}` : "";
    let prev: string | undefined;
    for (const p of [...points].sort((a, b) => a.t - b.t)) {
      if (p.s === prev) continue;
      prev = p.s;
      rows.push({ t: p.t, line: `${fmt.format(p.t)} ${name}: ${p.s}${unit}` });
    }
  }
  return rows.sort((a, b) => a.t - b.t).slice(-MAX_LOG_LINES).map((r) => r.line);
}
