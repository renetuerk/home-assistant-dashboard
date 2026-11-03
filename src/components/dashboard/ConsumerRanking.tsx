import { useEffect, useState } from "react";
import { BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HassEntity } from "@/lib/ha";
import type { DailyUsage } from "@/lib/ha-insights";
import { rankConsumers } from "@/lib/ha-consumers";
import { energyCost, formatEuro } from "@/lib/energy-costs";

export function ConsumerRanking({ ids, states, price, load, onSettings }: {
  ids: string[]; states: Record<string, HassEntity>; price: number;
  load: (ids: string[]) => Promise<Record<string, DailyUsage[]>>; onSettings: () => void;
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
      } catch { if (alive) { setUsage({}); setStatus("Verbrauchsstatistik nicht verfügbar"); } }
    };
    void run();
    const timer = setInterval(run, 15 * 60_000);
    return () => { alive = false; clearInterval(timer); };
  }, [key, load]);
  const rows = rankConsumers(ids, usage);
  const max = Math.max(1, ...rows.map((row) => row.kwh ?? 0));
  const fmt = (value: number) => value.toLocaleString("de-DE", { maximumFractionDigits: 1 });
  return <section aria-label="Größte Verbraucher" className="tile min-w-0 p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="min-w-0"><h2 className="flex items-center gap-2 text-sm"><BarChart3 className="size-4 shrink-0 text-primary" />Größte Verbraucher</h2>
        <p className="mt-1 text-xs text-muted-foreground">7 abgeschlossene Tage · {fmt(price)} €/kWh</p></div>
      <Button variant="ghost" size="icon" aria-label="Verbrauchszähler auswählen" title="Verbrauchszähler auswählen" onClick={onSettings}><Settings className="size-4" /></Button>
    </div>
    {status ? <p role="status" className="text-sm text-muted-foreground">{status}</p> : <ol className="space-y-4">
      {rows.map((row, i) => <li key={row.id} className="min-w-0">
        <div className="flex items-start justify-between gap-3 text-sm">
          <span className="min-w-0 break-words">{row.kwh != null && <span className="mr-2 text-primary">{i + 1}.</span>}{states[row.id]?.attributes.friendly_name ?? row.id}</span>
          <span className="shrink-0 text-right tabular-nums">{row.kwh == null ? "–" : `${fmt(row.kwh)} kWh`}<span className="block text-xs text-muted-foreground">{row.kwh == null ? `${row.days}/7 Tage verfügbar` : formatEuro(energyCost(row.kwh, price))}</span></span>
        </div>
        {row.kwh != null && <svg viewBox="0 0 300 6" preserveAspectRatio="none" className="mt-2 h-1.5 w-full" role="img" aria-label={`${states[row.id]?.attributes.friendly_name ?? row.id}: ${fmt(row.kwh)} kWh`}><rect width="300" height="6" rx="3" className="fill-muted" /><rect width={row.kwh / max * 300} height="6" rx="3" className={i === 0 ? "fill-primary" : "fill-cool"} /></svg>}
      </li>)}
    </ol>}
  </section>;
}