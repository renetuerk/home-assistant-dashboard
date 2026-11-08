import { useEffect, useState } from "react";
import { Cloud, CloudRain, CloudSun, Sun, Moon, Snowflake, CloudLightning, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ForecastMode, ForecastPoint } from "@/lib/ha-insights";

const icons = { sunny: Sun, "clear-night": Moon, partlycloudy: CloudSun, cloudy: Cloud, rainy: CloudRain, pouring: CloudRain, snowy: Snowflake, "snowy-rainy": Snowflake, lightning: CloudLightning, "lightning-rainy": CloudLightning };
const conditions: Record<string, string> = { sunny: "Sonnig", "clear-night": "Klar", partlycloudy: "Teils bewölkt", cloudy: "Bewölkt", rainy: "Regen", pouring: "Starkregen", snowy: "Schnee", fog: "Nebel", windy: "Windig", lightning: "Gewitter" };

export function WeatherForecast({ entityId, unit, load }: { entityId: string; unit: string; load: (id: string, mode: ForecastMode) => Promise<ForecastPoint[]> }) {
  const [mode, setMode] = useState<ForecastMode>("daily");
  const [points, setPoints] = useState<ForecastPoint[]>([]);
  const [state, setState] = useState("Lädt …");
  useEffect(() => {
    let alive = true;
    setPoints([]);
    setState("Lädt …");
    const run = () => load(entityId, mode).then((rows) => {
      if (alive) { setPoints(rows); setState(rows.length ? "" : "Keine Vorhersage verfügbar"); }
    }).catch(() => { if (alive) { setPoints([]); setState("Keine Vorhersage verfügbar"); } });
    run();
    const timer = setInterval(run, 30 * 60_000);
    return () => { alive = false; clearInterval(timer); };
  }, [entityId, mode, load]);
  return <div className="min-w-0">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm text-muted-foreground">Vorhersage</span>
      <div className="flex gap-1" aria-label="Vorhersagezeitraum">
        <Button size="sm" variant={mode === "hourly" ? "secondary" : "ghost"} aria-pressed={mode === "hourly"} onClick={() => setMode("hourly")}>Stunden</Button>
        <Button size="sm" variant={mode === "daily" ? "secondary" : "ghost"} aria-pressed={mode === "daily"} onClick={() => setMode("daily")}>Tage</Button>
      </div>
    </div>
    {state ? <p role="status" className="py-3 text-sm text-muted-foreground">{state}</p> : <div className="grid grid-cols-3 gap-1.5">
      {points.map((point) => {
        const Icon = icons[point.condition as keyof typeof icons] ?? Cloud;
        const date = new Date(point.datetime);
        return <div key={point.datetime} className="rounded-lg border bg-tile px-1.5 py-2 text-center" title={conditions[point.condition] ?? point.condition}>
          <div className="text-xs text-muted-foreground">{mode === "daily" ? date.toLocaleDateString("de-DE", { weekday: "short", day: "numeric" }) : date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</div>
          <Icon aria-label={conditions[point.condition] ?? point.condition} className="mx-auto my-1.5 size-5 text-primary" strokeWidth={1.5} />
          <div className="text-sm font-medium tabular-nums">{Math.round(point.temperature)}{unit}</div>
          <div className="min-h-4 text-xs tabular-nums text-muted-foreground">{mode === "daily" && point.templow != null ? `${Math.round(point.templow)}${unit}` : "\u00a0"}</div>
          {point.precipitation != null && <div className="mt-1 flex items-center justify-center gap-1 text-xs text-cool"><Droplets className="size-3 shrink-0" />{point.precipitation.toLocaleString("de-DE")}</div>}
        </div>;
      })}
    </div>}
  </div>;
}