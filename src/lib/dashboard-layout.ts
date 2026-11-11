export type WidgetColumn = "main" | "side";

export const WIDGETS = [
  { id: "favorites", label: "Favoriten", column: "main" },
  { id: "devices", label: "Geräte & Aktivität", column: "main" },
  { id: "summary", label: "Aktivitäts-Zusammenfassung", column: "main" },
  { id: "consumers", label: "Verbraucher-Ranking", column: "main" },
  { id: "consumption-anomalies", label: "Verbrauchsanomalien", column: "main" },
  { id: "climate-sensors", label: "Temperatur & Luftfeuchte", column: "main" },
  { id: "persons", label: "Anwesenheit", column: "side" },
  { id: "weather", label: "Wetter", column: "side" },
  { id: "energy", label: "Energie", column: "side" },
] as const;

export type WidgetId = (typeof WIDGETS)[number]["id"];

export type DashboardLayout = {
  main: WidgetId[];
  side: WidgetId[];
  hidden: WidgetId[];
  favorites: string[];
};

const KEY = "ha-dashboard-layout";
const ids = new Set<string>(WIDGETS.map((w) => w.id));

export function defaultLayout(): DashboardLayout {
  return {
    main: WIDGETS.filter((w) => w.column === "main").map((w) => w.id),
    side: WIDGETS.filter((w) => w.column === "side").map((w) => w.id),
    hidden: [],
    favorites: [],
  };
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/** Drops unknown/duplicate widgets and appends widgets added in newer versions to their default column. */
export function normalizeLayout(raw: unknown): DashboardLayout {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const seen = new Set<string>();
  const clean = (v: unknown) =>
    strings(v).filter((id): id is WidgetId => {
      if (!ids.has(id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  const main = clean(input["main"]);
  const side = clean(input["side"]);
  for (const w of WIDGETS) {
    if (seen.has(w.id)) continue;
    (w.column === "main" ? main : side).push(w.id);
  }
  const hidden = [...new Set(strings(input["hidden"]).filter((id): id is WidgetId => ids.has(id)))];
  return { main, side, hidden, favorites: [...new Set(strings(input["favorites"]))] };
}

/** Moves a widget into `column` at `index` (index refers to the column without the moved widget). */
export function moveWidget(layout: DashboardLayout, id: WidgetId, column: WidgetColumn, index: number): DashboardLayout {
  const next: DashboardLayout = { ...layout, main: layout.main.filter((w) => w !== id), side: layout.side.filter((w) => w !== id) };
  const target = [...next[column]];
  target.splice(Math.max(0, Math.min(index, target.length)), 0, id);
  next[column] = target;
  return next;
}

export function shiftWidget(layout: DashboardLayout, id: WidgetId, delta: -1 | 1): DashboardLayout {
  const column: WidgetColumn = layout.main.includes(id) ? "main" : "side";
  const at = layout[column].indexOf(id);
  const to = at + delta;
  if (at < 0 || to < 0 || to >= layout[column].length) return layout;
  return moveWidget(layout, id, column, to);
}

export function toggleHidden(layout: DashboardLayout, id: WidgetId): DashboardLayout {
  return { ...layout, hidden: layout.hidden.includes(id) ? layout.hidden.filter((w) => w !== id) : [...layout.hidden, id] };
}

export function toggleFavorite(layout: DashboardLayout, entityId: string): DashboardLayout {
  return {
    ...layout,
    favorites: layout.favorites.includes(entityId) ? layout.favorites.filter((f) => f !== entityId) : [...layout.favorites, entityId],
  };
}

export function loadLayout(): DashboardLayout {
  try {
    const saved = localStorage.getItem(KEY);
    return normalizeLayout(saved ? JSON.parse(saved) : null);
  } catch {
    return defaultLayout();
  }
}

export function saveLayout(layout: DashboardLayout) {
  try { localStorage.setItem(KEY, JSON.stringify(layout)); } catch { /* Still usable without browser storage. */ }
}
