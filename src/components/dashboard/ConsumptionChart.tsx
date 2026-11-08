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

type EnergySeries = {
  id: string;
  label: string;
  className: string;
};

export function EnergyHistoryChart({
  ids,
  load,
}: {
  ids: EnergySeries[];
  load: (ids: string[]) => Promise<Record<string, DailyUsage[]>>;
}) {
  const [data, setData] = useState<Record<string, DailyUsage[]>>({});
  const [state, setState] = useState("Lädt …");

  useEffect(() => {
    let alive = true;
    if (!ids.length) {
      setData({});
      setState("Keine Energiezähler für den Verlauf erkannt");
      return;
    }
    setState("Lädt …");
    const run = () => load(ids.map((s) => s.id))
      .then((result) => {
        if (!alive) return;
        setData(result);
        setState(ids.some((s) => (result[s.id] ?? []).some((d) => d.kwh != null)) ? "" : "Keine Energiestatistik verfügbar");
      })
      .catch(() => {
        if (alive) {
          setData({});
          setState("Energieverlauf nicht verfügbar");
        }
      });
    run();
    const timer = setInterval(run, 15 * 60_000);
    return () => { alive = false; clearInterval(timer); };
  }, [ids.map((s) => s.id).join("|"), load]);

  const days = ids.length ? (data[ids[0].id] ?? []).slice(-7) : [];
  const values = ids.flatMap((series) => (data[series.id] ?? []).slice(-7).flatMap((d) => d.kwh == null ? [] : [d.kwh]));
  const max = Math.max(...values, 1);
  const fmt = (value: number) => value.toLocaleString("de-DE", { maximumFractionDigits: 1 });

  return <div className="tile min-w-0 p-4">
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
      <span className="text-sm">Energieverlauf · 7 Tage</span>
      <span className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {ids.map((series) => <span key={series.id} className="flex items-center gap-1.5"><span className={`size-2 rounded-sm ${series.className}`} />{series.label}</span>)}
      </span>
    </div>
    {state ? <p role="status" className="text-sm text-muted-foreground">{state}</p> : <>
      <svg viewBox="0 0 350 180" className="h-36 w-full" role="img" aria-label="PV-Erzeugung, Netzbezug und Hausverbrauch der letzten sieben abgeschlossenen Tage in Kilowattstunden">
        <line x1="0" x2="350" y1="148" y2="148" className="stroke-border" />
        {days.map((day, i) => {
          const x = i * 50 + 25;
          const barWidth = Math.min(10, 30 / ids.length);
          const gap = 2;
          return <g key={day.start}>
            <title>{new Date(day.start).toLocaleDateString("de-DE")}</title>
            {ids.map((series, j) => {
              const row = (data[series.id] ?? []).find((d) => d.start === day.start);
              const value = row?.kwh;
              const height = value == null ? 0 : value / max * 112;
              const bx = x + (j - (ids.length - 1) / 2) * (barWidth + gap);
              return <g key={series.id}>
                {value != null && <rect x={bx - barWidth / 2} y={148 - height} width={barWidth} height={height} rx="2" className={series.className} />}
                {value != null && <title>{series.label}: {fmt(value)} kWh</title>}
              </g>;
            })}
            <text x={x} y="171" textAnchor="middle" className="fill-muted-foreground text-[11px]">
              {new Date(day.start).toLocaleDateString("de-DE", { weekday: "short" })}
            </text>
          </g>;
        })}
      </svg>
      <p className="mt-1 text-xs text-muted-foreground">kWh pro Tag</p>
    </>}
  </div>;
}
