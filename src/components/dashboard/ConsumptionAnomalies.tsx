import { useEffect, useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { HassEntity } from "@/lib/ha";
import type { DailyUsage } from "@/lib/ha-insights";

type Anomaly = {
  id: string;
  name: string;
  current: number;
  previous: number;
  percent: number;
};

export function ConsumptionAnomalies({
  ids,
  states,
  load,
}: {
  ids: string[];
  states: Record<string, HassEntity>;
  load: (ids: string[]) => Promise<Record<string, DailyUsage[]>>;
}) {
  const [usage, setUsage] = useState<Record<string, DailyUsage[]>>({});
  const [status, setStatus] = useState("");
  const key = JSON.stringify(ids);

  useEffect(() => {
    let alive = true;
    const selected: string[] = JSON.parse(key);
    setUsage({});
    if (!selected.length) { setStatus("Keine Verbrauchszähler ausgewählt"); return; }
    setStatus("Lädt …");
    const run = async () => {
      try {
        const result = await load(selected);
        if (alive) { setUsage(result); setStatus(""); }
      } catch {
        if (alive) { setUsage({}); setStatus("Verbrauchsstatistik nicht verfügbar"); }
      }
    };
    void run();
    const timer = setInterval(run, 15 * 60_000);
    return () => { alive = false; clearInterval(timer); };
  }, [key, load]);

  const anomalies: Anomaly[] = ids.flatMap((id) => {
    const days = usage[id] ?? [];
    if (days.length < 14) return [];
    const values = days.slice(-14).map((d) => d.kwh).filter((v): v is number => v != null);
    if (values.length < 14) return [];
    const previous = values.slice(0, 7).reduce((a, b) => a + b, 0);
    const current = values.slice(7).reduce((a, b) => a + b, 0);
    if (previous <= 0) return [];
    const percent = ((current - previous) / previous) * 100;
    if (Math.abs(percent) < 30 || Math.abs(current - previous) < 1) return [];
    return [{ id, name: states[id]?.attributes.friendly_name ?? id, current, previous, percent }];
  }).sort((a, b) => Math.abs(b.percent) - Math.abs(a.percent)).slice(0, 4);

  const fmt = (v: number) => v.toLocaleString("de-DE", { maximumFractionDigits: 1 });
  return <section aria-label="Verbrauchsanomalien" className="tile min-w-0 p-4">
    <div className="mb-3 flex items-center gap-2">
      <AlertTriangle className="size-4 shrink-0 text-primary" />
      <div><h2 className="text-sm">Verbrauchsanomalien</h2><p className="mt-0.5 text-xs text-muted-foreground">Letzte 7 Tage im Vergleich zur Vorwoche</p></div>
    </div>
    {status ? <p role="status" className="text-sm text-muted-foreground">{status}</p> :
      anomalies.length === 0 ? <div className="flex items-center gap-2 text-sm text-success"><Minus className="size-4" />Keine auffällige Abweichung erkannt</div> :
      <ul className="space-y-3">{anomalies.map((a) => {
        const up = a.percent > 0;
        const Icon = up ? ArrowUpRight : ArrowDownRight;
        return <li key={a.id} className="flex items-center justify-between gap-3">
          <span className="min-w-0 break-words text-sm">{a.name}</span>
          <span className={`flex shrink-0 items-center gap-1 text-sm font-medium tabular-nums ${up ? "text-destructive" : "text-success"}`}><Icon className="size-4" />{up ? "+" : "−"}{fmt(Math.abs(a.percent))} %</span>
        </li>;
      })}</ul>}
  </section>;
}