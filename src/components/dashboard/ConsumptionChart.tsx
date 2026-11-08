import { useEffect, useState } from "react";
import type { DailyUsage } from "@/lib/ha-insights";

export function ConsumptionChart({ entityId, load }: { entityId: string | undefined; load: (id: string) => Promise<DailyUsage[]> }) {
  const [days, setDays] = useState<DailyUsage[]>([]);
  const [state, setState] = useState("Lädt …");
  useEffect(() => {
    let alive = true;
    setDays([]);
    if (!entityId) { setState("Kein Hausverbrauchszähler ausgewählt"); return; }
    setState("Lädt …");
    const run = () => load(entityId).then((rows) => { if (alive) { setDays(rows); setState(rows.some((r) => r.kwh != null) ? "" : "Keine Verbrauchsstatistik verfügbar"); } })
      .catch(() => { if (alive) { setDays([]); setState("Verbrauchsverlauf nicht verfügbar"); } });
    run();
    const timer = setInterval(run, 15 * 60_000);
    return () => { alive = false; clearInterval(timer); };
  }, [entityId, load]);
  const values = days.flatMap((d) => d.kwh == null ? [] : [d.kwh]);
  const max = Math.max(...values, 1);
  const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const fmt = (value: number) => value.toLocaleString("de-DE", { maximumFractionDigits: 1 });
  return <div className="tile min-w-0 p-4">
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
      <span className="text-sm">Hausverbrauch · 7 Tage</span>
      {!state && <span className="text-xs text-muted-foreground">Ø {fmt(mean)} kWh</span>}
    </div>
    {state ? <p role="status" className="text-sm text-muted-foreground">{state}</p> : <>
      <svg viewBox="0 0 350 180" className="h-36 w-full" role="img" aria-label="Hausverbrauch der letzten sieben abgeschlossenen Tage in Kilowattstunden">
        <line x1="0" x2="350" y1="148" y2="148" className="stroke-border" />
        <line x1="0" x2="350" y1={148 - mean / max * 112} y2={148 - mean / max * 112} className="stroke-muted-foreground" strokeDasharray="3 4" opacity={0.4} />
        {days.map((day, i) => {
          const x = i * 50 + 25;
          const height = (day.kwh ?? 0) / max * 112;
          const label = new Date(day.start).toLocaleDateString("de-DE", { weekday: "short" });
          return <g key={day.start}>
            <title>{new Date(day.start).toLocaleDateString("de-DE")}: {day.kwh == null ? "Keine Daten" : `${fmt(day.kwh)} kWh`}</title>
            {day.kwh != null && <rect x={x - 14} y={148 - height} width="28" height={height} rx="3" className={day.kwh === Math.max(...values) ? "fill-primary" : "fill-cool"} />}
            <text x={x} y={day.kwh == null ? 140 : 140 - height} textAnchor="middle" className="fill-foreground text-[11px]">{day.kwh == null ? "–" : fmt(day.kwh)}</text>
            <text x={x} y="171" textAnchor="middle" className="fill-muted-foreground text-[11px]">{label}</text>
          </g>;
        })}
      </svg>
      <p className="mt-1 text-xs text-muted-foreground">kWh pro Tag · {days.filter((d) => d.kwh != null).length}/7 Tage verfügbar</p>
    </>}
  </div>;
}