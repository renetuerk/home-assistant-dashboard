import {
  Lightbulb,
  Power,
  Thermometer,
  Droplets,
  Minus,
  Plus,
  Lock,
  LockOpen,
  DoorOpen,
  DoorClosed,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Sun,
  Zap,
  BatteryMedium,
  Cloud,
  CloudRain,
  CloudSun,
  Moon,
  Wind,
  Siren,
  User,
  UserCheck,
  Euro,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { energyCost, formatEuro } from "@/lib/energy-costs";
import { cn } from "@/lib/utils";
import type { HassEntity } from "@/lib/ha";
export { CameraTile } from "./CameraTile";

type Call = (domain: string, service: string, data: Record<string, any>) => void;
const name = (e: HassEntity) => e.attributes.friendly_name ?? e.entity_id;

export function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <h2 className="eyebrow">{title}</h2>
      {children}
    </section>
  );
}

export function LightTile({ e, call }: { e: HassEntity; call: Call }) {
  const on = e.state === "on";
  const domain = e.entity_id.split(".")[0] ?? "";
  const pct = e.attributes.brightness != null ? Math.round((e.attributes.brightness / 255) * 100) : on ? 100 : 0;
  const dimmable = domain === "light" && e.attributes.brightness !== undefined;
  const Icon = domain === "light" ? Lightbulb : Power;
  return (
    <div className={cn("tile flex flex-col justify-between gap-2.5 p-3.5 min-h-28", on && "tile-on")}>
      <button
        onClick={() => call(domain, "toggle", { entity_id: e.entity_id })}
        className="flex items-start justify-between text-left"
      >
        <span
          className={cn(
            "grid size-9 place-items-center rounded-full transition-colors",
            on ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
          )}
        >
          <Icon className="size-5" />
        </span>
        <span className="text-sm text-muted-foreground">{on ? (dimmable ? `${pct}%` : "An") : "Aus"}</span>
      </button>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{name(e)}</span>
        {dimmable && (
          <Slider
            value={[pct]}
            max={100}
            step={1}
            onValueCommit={([v]) => call("light", "turn_on", { entity_id: e.entity_id, brightness_pct: v })}
          />
        )}
      </div>
    </div>
  );
}

export function ClimateTile({ e, call }: { e: HassEntity; call: Call }) {
  const a = e.attributes;
  const target = Number(a.temperature ?? 0);
  const set = (t: number) => call("climate", "set_temperature", { entity_id: e.entity_id, temperature: t });
  const heating = a.hvac_action === "heating";
  return (
    <div className={cn("tile flex flex-col gap-4 p-5", heating && "tile-on")}>
      <div className="flex items-center justify-between">
        <span className="font-medium">{name(e)}</span>
        <span className={cn("text-xs", heating ? "text-primary" : "text-muted-foreground")}>
          {heating ? "Heizt" : e.state === "off" ? "Aus" : "Bereit"}
        </span>
      </div>
      <div className="flex items-end gap-1">
        <span className="font-display text-5xl leading-none">{Number(a.current_temperature ?? 0).toFixed(1)}</span>
        <span className="pb-1 text-muted-foreground">°C</span>
      </div>
      <div className="flex items-center justify-between rounded-full bg-secondary p-1">
        <button onClick={() => set(target - 0.5)} className="grid size-10 place-items-center rounded-full hover:bg-accent" aria-label="Kälter">
          <Minus className="size-4" />
        </button>
        <span className="text-sm">Ziel {target.toFixed(1)}°</span>
        <button onClick={() => set(target + 0.5)} className="grid size-10 place-items-center rounded-full hover:bg-accent" aria-label="Wärmer">
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function SensorChip({ e }: { e: HassEntity }) {
  const Icon = e.attributes.device_class === "humidity" ? Droplets : Thermometer;
  return (
    <div className="tile flex items-center gap-3 px-4 py-3">
      <Icon className="size-4 text-cool" />
      <span className="flex-1 text-sm text-muted-foreground">{name(e)}</span>
      <span className="font-medium">
        {e.state}
        <span className="text-muted-foreground"> {e.attributes.unit_of_measurement}</span>
      </span>
    </div>
  );
}

const weatherIcon: Record<string, any> = {
  sunny: Sun,
  "clear-night": Moon,
  partlycloudy: CloudSun,
  cloudy: Cloud,
  rainy: CloudRain,
  pouring: CloudRain,
};
const weatherText: Record<string, string> = {
  sunny: "Sonnig",
  "clear-night": "Klar",
  partlycloudy: "Teils bewölkt",
  cloudy: "Bewölkt",
  rainy: "Regen",
  pouring: "Starkregen",
  fog: "Nebel",
  snowy: "Schnee",
  windy: "Windig",
  lightning: "Gewitter",
};

export function WeatherTile({ e }: { e: HassEntity }) {
  const Icon = weatherIcon[e.state] ?? Cloud;
  const a = e.attributes;
  return (
    <div className="tile flex items-center gap-4 p-4">
      <Icon className="size-10 text-primary" strokeWidth={1.25} />
      <div className="flex-1">
        <div className="font-display text-3xl leading-none">
          {a.temperature}
          {a.temperature_unit ?? "°C"}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">{weatherText[e.state] ?? e.state}</div>
      </div>
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-2"><Droplets className="size-4" />{a.humidity}%</span>
        <span className="flex items-center gap-2"><Wind className="size-4" />{a.wind_speed} km/h</span>
      </div>
    </div>
  );
}

export function EnergyFlowTile({ power, pv }: { power: HassEntity | undefined; pv: HassEntity | undefined }) {
  const pvW = Math.max(0, Number(pv?.state ?? 0));
  const useW = Math.max(0, Number(power?.state ?? 0));
  const feedInW = Math.max(0, pvW - useW);
  const gridW = Math.max(0, useW - pvW);
  const ownW = Math.min(pvW, useW);
  const fmt = (w: number) => `${Math.round(w).toLocaleString("de-DE")} W`;
  if (!pv && !power) return null;
  return (
    <div className="tile flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Energiefluss</span>
        <span className={cn("text-sm font-medium", feedInW > 0 ? "text-primary" : gridW > 0 ? "text-cool" : "text-success")}>
          {feedInW > 0 ? "Überschuss" : gridW > 0 ? "Netzbezug" : "ausgeglichen"}
        </span>
      </div>
      <div className="grid grid-cols-3 items-center gap-2 text-center">
        <div className="rounded-xl bg-secondary p-2.5">
          <Sun className="mx-auto mb-1 size-5 text-primary" />
          <div className="font-medium">{fmt(pvW)}</div>
          <div className="text-[11px] text-muted-foreground">PV</div>
        </div>
        <div className="text-muted-foreground">
          <div className="text-lg">→</div>
          <div className="text-[11px] tabular-nums">{fmt(ownW)}</div>
          <div className="text-[10px] text-muted-foreground">Eigenverbrauch</div>
        </div>
        <div className="rounded-xl bg-secondary p-2.5">
          <Zap className="mx-auto mb-1 size-5 text-cool" />
          <div className="font-medium">{fmt(useW)}</div>
          <div className="text-[11px] text-muted-foreground">Haus</div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs">
        <span>{feedInW > 0 ? `↗ Einspeisung ${fmt(feedInW)}` : `↙ Netzbezug ${fmt(gridW)}`}</span>
        <span className="text-muted-foreground">PV → Haus {Math.round(pvW ? ownW / pvW * 100 : 0)}%</span>
      </div>
    </div>
  );
}

export function EnergySurplusTile({ states }: { states: Record<string, HassEntity> }) {
  const entries = Object.values(states);
  const find = (re: RegExp) => entries.find((e) => /^(switch|climate)\./.test(e.entity_id) && re.test(`${e.entity_id} ${e.attributes.friendly_name ?? ""}`));
  const candidates = [
    { re: /entfeucht|dehumid/i, label: "Entfeuchter", icon: Droplets },
    { re: /pool|solarpumpe/i, label: "Poolpumpe", icon: Activity },
    { re: /infrarot|heizung|heater/i, label: "Infrarotheizung", icon: Thermometer },
    { re: /geschirrspuel|spülmaschine|dishwasher/i, label: "Geschirrspüler", icon: Activity },
    { re: /waschmaschine|washing/i, label: "Waschmaschine", icon: Activity },
    { re: /trockner|dryer/i, label: "Trockner", icon: Activity },
  ].map((c) => ({ ...c, e: find(c.re) })).filter((x) => x.e);
  if (!candidates.length) return null;
  const pv = entries.find((e) => /^(sensor)\./.test(e.entity_id) && /pv|solar|photovoltaik|wechselrichter/i.test(`${e.entity_id} ${e.attributes.friendly_name ?? ""}`) && ["W","kW"].includes(String(e.attributes.unit_of_measurement ?? "")));
  const use = entries.find((e) => /^(sensor)\./.test(e.entity_id) && /hausverbrauch|haus verbrauch|consumption|netzbezug/i.test(`${e.entity_id} ${e.attributes.friendly_name ?? ""}`) && ["W","kW"].includes(String(e.attributes.unit_of_measurement ?? "")));
  const pvW = Math.max(0, Number(pv?.state ?? 0));
  const useW = Math.max(0, Number(use?.state ?? 0));
  const surplus = Math.max(0, pvW - useW);
  const active = candidates.filter((x) => ["on","heat","heating","open"].includes(x.e!.state));
  const recommendation = surplus >= 1000 ? "Guter Zeitpunkt für einen größeren Verbraucher" : surplus >= 450 ? "PV-Überschuss für flexible Verbraucher verfügbar" : "Aktuell wenig PV-Überschuss";
  return (
    <div className="tile flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">PV-Überschuss</span>
        <span className={cn("font-display text-2xl", surplus > 0 ? "text-primary" : "text-muted-foreground")}>{surplus.toLocaleString("de-DE")} W</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sun className="size-3.5 text-primary" /> {recommendation}
      </div>
      {dailyCoverage != null && pvToday && today && <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-secondary p-2.5"><div className="font-medium">{pvKwh.toLocaleString("de-DE", { maximumFractionDigits: 1 })} kWh</div><div className="text-xs text-muted-foreground">PV-Ertrag heute</div></div>
        <div className="rounded-xl bg-secondary p-2.5"><div className="font-medium">{useKwh.toLocaleString("de-DE", { maximumFractionDigits: 1 })} kWh</div><div className="text-xs text-muted-foreground">Verbrauch heute</div></div>
      </div>}
      <div className="grid grid-cols-2 gap-2">
        {candidates.map(({ e, label, icon: Icon }) => {
          const on = ["on","heat","heating","open"].includes(e!.state);
          return <div key={e!.entity_id} className="flex items-center gap-2 rounded-xl bg-secondary px-2.5 py-2">
            <Icon className={cn("size-3.5", on ? "text-primary" : "text-muted-foreground")} />
            <span className="min-w-0 flex-1 truncate text-xs">{label}</span>
            <span className={cn("text-[10px]", on ? "text-success" : "text-muted-foreground")}>{on ? "AN" : "AUS"}</span>
          </div>;
        })}
      </div>
    </div>
  );
}

export function EnergyTile({ power, pv, today, pvToday, battery }: { power: HassEntity | undefined; pv: HassEntity | undefined; today: HassEntity | undefined; pvToday: HassEntity | undefined; battery: HassEntity | undefined }) {
  const rows = [
    { e: pv, icon: Sun, color: "text-primary" },
    { e: power, icon: Zap, color: "text-cool" },
    { e: today, icon: Activity, color: "text-muted-foreground" },
    { e: battery, icon: BatteryMedium, color: "text-success" },
  ].filter((r) => r.e);
  const pvKwh = Number(pvToday?.state ?? NaN);
  const useKwh = Number(today?.state ?? NaN);
  const dailyCoverage = Number.isFinite(pvKwh) && Number.isFinite(useKwh) && useKwh > 0 ? Math.min(100, (pvKwh / useKwh) * 100) : null;
  return (
    <div className="tile flex flex-col gap-3 p-4">
      {dailyCoverage != null && pvToday && today && (
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Tagesbilanz · PV-Anteil</span>
            <span className="font-display text-2xl">{Math.round(dailyCoverage)}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${dailyCoverage}%` }} />
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {rows.map(({ e, icon: Icon, color }) => (
          <div key={e!.entity_id} className="rounded-xl bg-secondary p-2.5">
            <Icon className={cn("mb-1.5 size-4", color)} />
            <div className="font-medium">
              {e!.state} <span className="text-sm text-muted-foreground">{e!.attributes.unit_of_measurement}</span>
            </div>
            <div className="text-xs text-muted-foreground">{name(e!)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SecurityRow({ e, call }: { e: HassEntity; call: Call }) {
  const domain = e.entity_id.split(".")[0] ?? "";
  let Icon = Activity;
  let label = e.state;
  let alert = false;
  let action: (() => void) | undefined;
  if (domain === "lock") {
    const locked = e.state === "locked";
    Icon = locked ? Lock : LockOpen;
    label = locked ? "Verriegelt" : "Offen";
    alert = !locked;
    action = () => call("lock", locked ? "unlock" : "lock", { entity_id: e.entity_id });
  } else if (domain === "alarm_control_panel") {
    const armed = e.state.startsWith("armed");
    Icon = armed ? ShieldCheck : ShieldAlert;
    label = armed ? "Scharf" : e.state === "triggered" ? "Ausgelöst!" : "Unscharf";
    alert = e.state === "triggered";
    action = () => call("alarm_control_panel", armed ? "alarm_disarm" : "alarm_arm_away", { entity_id: e.entity_id });
  } else {
    const on = e.state === "on";
    const dc = e.attributes.device_class;
    if (dc === "motion") {
      Icon = Activity;
      label = on ? "Bewegung" : "Ruhig";
    } else {
      Icon = on ? DoorOpen : DoorClosed;
      label = on ? "Offen" : "Geschlossen";
    }
    alert = on;
  }
  return (
    <button
      onClick={action}
      disabled={!action}
      className="tile flex w-full items-center gap-3 px-4 py-3 text-left enabled:active:scale-[0.98]"
    >
      <Icon className={cn("size-5", alert ? "text-destructive" : "text-success")} />
      <span className="flex-1">{name(e)}</span>
      <span className={cn("text-sm", alert ? "text-destructive" : "text-muted-foreground")}>{label}</span>
    </button>
  );
}

export function SmokeRow({ e }: { e: HassEntity }) {
  const alarm = e.state === "on";
  const batt = e.attributes.battery_level ?? e.attributes.battery;
  return (
    <div className={cn("tile flex w-full items-center gap-3 px-4 py-3", alarm && "tile-on border-destructive/40")}>
      <Siren className={cn("size-5", alarm ? "animate-pulse text-destructive" : "text-success")} />
      <span className="flex-1">{name(e)}</span>
      {batt != null && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <BatteryMedium className="size-3.5" />
          {batt}%
        </span>
      )}
      <span className={cn("text-sm", alarm ? "font-medium text-destructive" : "text-muted-foreground")}>
        {alarm ? "Alarm!" : "Bereit"}
      </span>
    </div>
  );
}

export function PersonChip({ e }: { e: HassEntity }) {
  const home = e.state === "home";
  const label = home ? "Zuhause" : e.state === "not_home" ? "Unterwegs" : e.state;
  return (
    <div className={cn("tile flex items-center gap-3 px-4 py-3", home && "tile-on")}>
      {home ? <UserCheck className="size-4 text-success" /> : <User className="size-4 text-muted-foreground" />}
      <span className="flex-1 text-sm">{name(e)}</span>
      <span className={cn("text-sm", home ? "text-success" : "text-muted-foreground")}>{label}</span>
    </div>
  );
}

export function EnergyCostTile({
  today,
  month,
  price,
}: {
  today: HassEntity | undefined;
  month: HassEntity | undefined;
  price: number;
}) {
  const rows = [
    { label: "Heute", e: today },
    { label: "Monat", e: month },
  ].filter((r) => r.e && Number.isFinite(Number(r.e.state)));
  if (rows.length === 0) return null;
  return (
    <div className="tile flex flex-col gap-2.5 p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Euro className="size-4 text-primary" />
        Stromkosten · {price.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €/kWh
      </div>
      <div className="grid grid-cols-2 gap-2">
        {rows.map(({ label, e }) => {
          const kwh = Number(e!.state);
          return (
            <div key={label} className="rounded-xl bg-secondary p-2.5">
              <div className="font-medium">{formatEuro(energyCost(kwh, price))}</div>
              <div className="text-xs text-muted-foreground">
                {label} · {kwh.toLocaleString("de-DE")} kWh
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
