export type ForecastMode = "hourly" | "daily";
export type ForecastPoint = { datetime: string; condition: string; temperature: number; templow?: number; precipitation?: number };
export type DailyUsage = { start: number; kwh: number | null };

/** Calendar days, not fixed 24-hour intervals (daylight saving time). */
export function energyWindow(now = new Date(), count = 7) {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);
  start.setDate(start.getDate() - count);
  const days = Array.from({ length: count }, (_, i) => {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    return day.getTime();
  });
  return { start, end, days };
}

export function dailyUsage(rows: { start: number | string; change?: number | null }[], now = new Date(), count = 7): DailyUsage[] {
  const { days } = energyWindow(now, count);
  return days.map((start) => {
    const row = rows.find((r) => {
      const t = typeof r.start === "number" ? (r.start < 1e12 ? r.start * 1000 : r.start) : Date.parse(r.start);
      const date = new Date(t);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() === start;
    });
    const value = row?.change;
    return { start, kwh: typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null };
  });
}

export function forecastPoints(rows: unknown): ForecastPoint[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!row || typeof row.datetime !== "string" || !Number.isFinite(Date.parse(row.datetime)) || typeof row.temperature !== "number" || !Number.isFinite(row.temperature)) return [];
    return [{ datetime: row.datetime, condition: String(row.condition ?? "cloudy"), temperature: row.temperature,
      ...(typeof row.templow === "number" ? { templow: row.templow } : {}),
      ...(typeof row.precipitation === "number" ? { precipitation: row.precipitation } : {}),
    }];
  }).sort((a, b) => Date.parse(a.datetime) - Date.parse(b.datetime));
}