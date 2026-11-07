export type StatePoint = { t: number; s: string };
export type StateHistory = Record<string, StatePoint[]>;

/** HA includes the state at the start of the window; retain it as context. */
export function parseStateHistory(result: unknown, ids: string[], start: number, end: number): StateHistory {
  if (!result || typeof result !== "object" || Array.isArray(result)) throw new Error("Aktivitätsverlauf aus Home Assistant nicht verfügbar.");
  const records = result as Record<string, unknown>;
  return Object.fromEntries(ids.map(id => {
    const raw = records[id];
    const points = (Array.isArray(raw) ? raw : []).flatMap((point: unknown) => {
      if (!point || typeof point !== "object") return [];
      const p = point as Record<string, unknown>;
      const time = Number(p["lc"] ?? p["lu"]) * 1000;
      return typeof p["s"] === "string" && Number.isFinite(time) && time <= end
        ? [{ t: Math.max(start, time), s: p["s"] }] : [];
    });
    return [id, points.sort((a, b) => a.t - b.t)];
  }));
}

export function demoStateHistory(ids: string[], states: Record<string, { state: string }>, hours: number, now = Date.now()): StateHistory {
  const window = hours * 3600_000;
  return Object.fromEntries(ids.map(id => {
    const state = states[id]?.state;
    if (state === undefined) return [id, []];
    const previous = state === "on" ? "off" : state === "off" ? "on" : state;
    return [id, [{ t: now - window * 0.75, s: previous }, { t: now - window * 0.25, s: state }]];
  }));
}