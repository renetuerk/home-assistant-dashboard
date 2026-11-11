import { Activity, Sun, Zap, Gauge } from "lucide-react";
import type { HassEntity } from "@/lib/ha";
import { cn } from "@/lib/utils";

function formatPower(value: number) {
  if (!Number.isFinite(value)) return "–";
  return `${Math.round(value).toLocaleString("de-DE")} W`;
}

function formatEnergy(value: number, unit?: string) {
  if (!Number.isFinite(value)) return "–";
  const normalized = unit === "Wh" ? value / 1000 : unit === "MWh" ? value * 1000 : value;
  return `${normalized.toLocaleString("de-DE", { maximumFractionDigits: 1 })} kWh`;
}

export function EnergyCockpit({
  pv,
  power,
  today,
}: {
  pv: HassEntity | undefined;
  power: HassEntity | undefined;
  today: HassEntity | undefined;
}) {
  if (!pv && !power && !today) return null;

  const pvW = Math.max(0, Number(pv?.state ?? 0));
  const useW = Math.max(0, Number(power?.state ?? 0));
  const surplusW = Math.max(0, pvW - useW);
  const gridW = Math.max(0, useW - pvW);
  const ownW = Math.min(pvW, useW);
  const pvShare = pvW > 0 ? Math.round((ownW / pvW) * 100) : 0;

  return (
    <div className="tile flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">Energie-Cockpit</div>
          <div className="text-xs text-muted-foreground">Aktuelle Situation</div>
        </div>
        <Gauge className="size-5 text-primary" />
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-xl bg-secondary p-3">
          <Sun className="mb-1.5 size-4 text-primary" />
          <div className="font-display text-2xl">{formatPower(pvW)}</div>
          <div className="text-xs text-muted-foreground">PV-Leistung</div>
        </div>

        <div className="rounded-xl bg-secondary p-3">
          <Activity className="mb-1.5 size-4 text-muted-foreground" />
          <div className="font-display text-2xl">{formatPower(useW)}</div>
          <div className="text-xs text-muted-foreground">Hausverbrauch</div>
        </div>

        <div className="rounded-xl bg-secondary p-3">
          <Zap className={cn("mb-1.5 size-4", surplusW > 0 ? "text-primary" : "text-cool")} />
          <div className="font-display text-2xl">{formatPower(surplusW > 0 ? surplusW : gridW)}</div>
          <div className="text-xs text-muted-foreground">{surplusW > 0 ? "PV-Überschuss" : "Netzbezug"}</div>
        </div>

        <div className="rounded-xl bg-secondary p-3">
          <Gauge className="mb-1.5 size-4 text-success" />
          <div className="font-display text-2xl">{formatEnergy(Number(today?.state ?? NaN), today?.attributes.unit_of_measurement)}</div>
          <div className="text-xs text-muted-foreground">Verbrauch heute</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2 text-xs">
        <span className={cn(surplusW > 0 ? "text-primary" : "text-cool")}>
          {surplusW > 0 ? "☀️ PV deckt den aktuellen Verbrauch" : "⚡ Aktuell wird Strom aus dem Netz bezogen"}
        </span>
        {pv && power && (
          <span className="text-muted-foreground">
            PV → Haus {pvShare} %
          </span>
        )}
      </div>
    </div>
  );
}
