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
  dotClass: string;
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

  const dayStarts = [...new Set(ids.flatMap((series) => (data[series.id] ?? []).slice(-7).map((d) => d.start)))].sort((a, b) => a - b);
  const days = dayStarts.map((start) => ({ start, kwh: null }));
  const values = ids.flatMap((series) => (data[series.id] ?? []).slice(-7).flatMap((d) => d.kwh == null ? [] : [d.kwh]));
  const rawMax = Math.max(...values, 1);
  const axisMax = Math.ceil(rawMax / 5) * 5 || 5;
  const fmt = (value: number) => value.toLocaleString("de-DE", { maximumFractionDigits: 1 });
  const ticks = 4;
  const plotTop = 10;
  const plotBottom = 148;
  const plotHeight = plotBottom - plotTop;
  const axisX = 24;
  const plotLeft = 36;
  const plotRight = 346;
  const maxForSeries = (id: string) => Math.max(...((data[id] ?? []).slice(-7).flatMap((d) => d.kwh == null ? [] : [d.kwh])), 0);

  return <div className="tile min-w-0 p-4">
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
      <span className="text-sm">Energieverlauf · 7 Tage</span>
      <span className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {ids.map((series) => <span key={series.id} className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${series.dotClass}`} />{series.label}</span>)}
      </span>
    </div>
    {state ? <p role="status" className="text-sm text-muted-foreground">{state}</p> : <>
      <svg viewBox="0 0 350 180" className="h-40 w-full" role="img" aria-label="PV-Erzeugung, Netzbezug und Hausverbrauch der letzten sieben abgeschlossenen Tage in Kilowattstunden">
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const value = axisMax * (1 - i / ticks);
          const y = plotTop + i * plotHeight / ticks;
          return <g key={i}>
            <line x1={plotLeft} x2={plotRight} y1={y} y2={y} className="stroke-border" opacity={i === ticks ? 1 : 0.55} />
            <text x={axisX} y={y + 3.5} textAnchor="end" className="fill-muted-foreground text-[9px]">{fmt(value)}</text>
          </g>;
        })}
        {days.map((day, i) => {
          const x = plotLeft + (i + 0.5) * ((plotRight - plotLeft) / 7);
          const available = ids.filter((series) => (data[series.id] ?? []).some((d) => d.kwh != null));
          const barWidth = Math.min(10, 30 / Math.max(available.length, 1));
          const gap = 2;
          return <g key={day.start}>
            <title>{new Date(day.start).toLocaleDateString("de-DE")}</title>
            {available.map((series, j) => {
              const row = (data[series.id] ?? []).find((d) => d.start === day.start);
              const value = row?.kwh;
              const height = value == null ? 0 : value / axisMax * plotHeight;
              const bx = x + (j - (ids.length - 1) / 2) * (barWidth + gap);
              const isHighest = value != null && value === maxForSeries(series.id);
              return <g key={series.id}>
                {value != null && <rect x={bx - barWidth / 2} y={plotBottom - height} width={barWidth} height={height} rx="2" className={series.className} opacity={isHighest ? 1 : 0.72} stroke={isHighest ? "currentColor" : "none"} strokeWidth={isHighest ? 1.5 : 0} />}
                {value != null && <text x={bx} y={Math.max(plotTop + 9, plotBottom - height - 3)} textAnchor="middle" className="fill-foreground text-[8px]">{fmt(value)}</text>}
                {value != null && <title>{series.label}: {fmt(value)} kWh</title>}
              </g>;
            })}
            <text x={x} y="171" textAnchor="middle" className="fill-muted-foreground text-[10px]">
              {new Date(day.start).toLocaleDateString("de-DE", { weekday: "short" })}
            </text>
          </g>;
        })}
      </svg>
      <p className="mt-1 text-xs text-muted-foreground">kWh pro Tag · höchster Tageswert je Kategorie hervorgehoben</p>
    </>}
  </div>;
}
