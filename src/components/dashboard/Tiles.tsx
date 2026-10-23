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
  Video,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { HassEntity } from "@/lib/ha";

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
    <div className={cn("tile flex flex-col justify-between gap-4 p-5 min-h-36", on && "tile-on")}>
      <button
        onClick={() => call(domain, "toggle", { entity_id: e.entity_id })}
        className="flex items-start justify-between text-left"
      >
        <span
          className={cn(
            "grid size-11 place-items-center rounded-full transition-colors",
            on ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
          )}
        >
          <Icon className="size-5" />
        </span>
        <span className="text-sm text-muted-foreground">{on ? (dimmable ? `${pct}%` : "An") : "Aus"}</span>
      </button>
      <div className="flex flex-col gap-3">
        <span className="font-medium">{name(e)}</span>
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
    <div className="tile flex items-center gap-5 p-5">
      <Icon className="size-14 text-primary" strokeWidth={1.25} />
      <div className="flex-1">
        <div className="font-display text-4xl leading-none">
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

export function EnergyTile({ power, pv, today, battery }: { power: HassEntity | undefined; pv: HassEntity | undefined; today: HassEntity | undefined; battery: HassEntity | undefined }) {
  const rows = [
    { e: pv, icon: Sun, color: "text-primary" },
    { e: power, icon: Zap, color: "text-cool" },
    { e: today, icon: Activity, color: "text-muted-foreground" },
    { e: battery, icon: BatteryMedium, color: "text-success" },
  ].filter((r) => r.e);
  const pvW = Number(pv?.state ?? 0);
  const useW = Number(power?.state ?? 0);
  const ratio = pvW + useW > 0 ? Math.min(100, (pvW / Math.max(useW, 1)) * 100) : 0;
  return (
    <div className="tile flex flex-col gap-4 p-5">
      {pv && power && (
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Eigenversorgung</span>
            <span className="font-display text-3xl">{Math.round(ratio)}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${ratio}%` }} />
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {rows.map(({ e, icon: Icon, color }) => (
          <div key={e!.entity_id} className="rounded-xl bg-secondary p-3">
            <Icon className={cn("mb-2 size-4", color)} />
            <div className="text-lg font-medium">
              {e!.state} <span className="text-sm text-muted-foreground">{e!.attributes.unit_of_measurement}</span>
            </div>
            <div className="text-xs text-muted-foreground">{name(e!)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CameraTile({ e, src }: { e: HassEntity; src: string | null }) {
  return (
    <div className="tile relative aspect-video overflow-hidden">
      {src ? (
        <img src={src} alt={name(e)} className="size-full object-cover" />
      ) : (
        <div className="grid size-full place-items-center bg-secondary">
          <Video className="size-8 text-muted-foreground" />
        </div>
      )}
      <span className="absolute bottom-3 left-3 rounded-full bg-background/70 px-3 py-1 text-xs backdrop-blur">
        {name(e)}
      </span>
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
