import { useMemo } from "react";
import { Lightbulb, Sun, Zap } from "lucide-react";
import type { HassEntity } from "@/lib/ha";

type Tip = { title: string; text: string; icon: "sun" | "zap" | "light" };

export function EnergyTips({
  pv,
  power,
  today,
  states,
}: {
  pv?: HassEntity;
  power?: HassEntity;
  today?: HassEntity;
  states: Record<string, HassEntity>;
}) {
  const tips = useMemo<Tip[]>(() => {
    const pvW = pv ? Number(pv.state) : NaN;
    const loadW = power ? Number(power.state) : NaN;
    const todayKwh = today ? Number(today.state) : NaN;
    const result: Tip[] = [];

    if (Number.isFinite(pvW) && Number.isFinite(loadW)) {
      const surplus = pvW - loadW;
      if (surplus > 500) {
        result.push({ title: "PV-Überschuss nutzen", text: `Aktuell stehen rund ${Math.round(surplus)} W für zusätzliche Verbraucher zur Verfügung.`, icon: "sun" });
      } else if (surplus < -500) {
        result.push({ title: "Netzbezug reduzieren", text: `Das Haus benötigt aktuell etwa ${Math.round(Math.abs(surplus))} W mehr als die PV liefert. Wenn möglich, größere Verbraucher verschieben.`, icon: "zap" });
      } else {
        result.push({ title: "Gute Balance", text: "PV-Erzeugung und Hausverbrauch liegen aktuell nah beieinander.", icon: "sun" });
      }
    }

    if (Number.isFinite(todayKwh)) {
      if (todayKwh > 15) result.push({ title: "Verbrauch im Blick behalten", text: `Heute wurden bereits ${todayKwh.toLocaleString("de-DE", { maximumFractionDigits: 1 })} kWh verbraucht.`, icon: "zap" });
      else if (todayKwh > 0) result.push({ title: "Verbrauch im grünen Bereich", text: `Der bisherige Tagesverbrauch liegt bei ${todayKwh.toLocaleString("de-DE", { maximumFractionDigits: 1 })} kWh.`, icon: "light" });
    }

    const active = Object.values(states).filter((e) => e.state === "on" && ["switch", "light"].some((d) => e.entity_id.startsWith(d + ".")));
    if (active.length > 8) {
      result.push({ title: "Unnötige Verbraucher prüfen", text: `${active.length} Schalter oder Lichter sind aktuell eingeschaltet. Vielleicht lässt sich etwas abschalten.`, icon: "light" });
    }

    return result.slice(0, 3);
  }, [pv, power, today, states]);

  return <section aria-label="Intelligente Energie-Tipps" className="tile min-w-0 p-4">
    <div className="mb-3 flex items-center gap-2">
      <Lightbulb className="size-4 shrink-0 text-primary" />
      <div><h2 className="text-sm">Intelligente Energie-Tipps</h2><p className="mt-0.5 text-xs text-muted-foreground">Aus deinen aktuellen Energiedaten abgeleitet</p></div>
    </div>
    {tips.length ? <ul className="space-y-3">{tips.map((tip) => {
      const Icon = tip.icon === "sun" ? Sun : tip.icon === "zap" ? Zap : Lightbulb;
      return <li key={tip.title} className="flex gap-3">
        <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
        <div><p className="text-sm">{tip.title}</p><p className="text-xs text-muted-foreground">{tip.text}</p></div>
      </li>;
    })}</ul> : <p className="text-sm text-muted-foreground">Noch nicht genügend Energiedaten für einen Tipp.</p>}
  </section>;
}