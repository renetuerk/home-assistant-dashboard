import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Settings } from "lucide-react";
import { cameraUrl, loadConfig, saveConfig, useHomeAssistant, type HaConfig, type HassEntity } from "@/lib/ha";
import {
  CameraTile,
  EnergyTile,
  Section,
  SensorChip,
  WeatherTile,
} from "@/components/dashboard/Tiles";
import { ActivityOverview } from "@/components/dashboard/ActivityOverview";
import { SettingsDialog } from "@/components/dashboard/SettingsDialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zuhause – Home Assistant Dashboard" },
      { name: "description", content: "Elegantes Wand-Dashboard für Licht, Klima, Energie und Sicherheit in Home Assistant." },
      { property: "og:title", content: "Zuhause – Home Assistant Dashboard" },
      { property: "og:description", content: "Elegantes Wand-Dashboard für Licht, Klima, Energie und Sicherheit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function Dashboard() {
  const [config, setConfig] = useState<HaConfig | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => setConfig(loadConfig()), []);
  useEffect(() => {
    // Keep the wall tablet screen awake while the dashboard is open.
    let lock: any = null;
    const req = async () => {
      try { lock = await (navigator as any).wakeLock?.request("screen"); } catch { /* unsupported */ }
    };
    const onVis = () => { if (document.visibilityState === "visible") req(); };
    req();
    document.addEventListener("visibilitychange", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); lock?.release?.(); };
  }, []);
  const { states, status, error, callService } = useHomeAssistant(config);
  const now = useClock();

  const g = useMemo(() => {
    const all = Object.values(states).filter((e) => !e.attributes.hidden && e.state !== "unavailable");
    const d = (p: string) => all.filter((e) => e.entity_id.startsWith(p + "."));
    const sensors = d("sensor");
    const byClass = (c: string) => sensors.filter((e) => e.attributes.device_class === c);
    const find = (c: string, re: RegExp) => byClass(c).find((e) => re.test(e.entity_id + (e.attributes.friendly_name ?? "")));
    const inName = (e: HassEntity, re: RegExp) => re.test(e.entity_id + " " + (e.attributes.friendly_name ?? ""));
    const isPowerUnit = (e: HassEntity) => ["W", "kW"].includes(String(e.attributes.unit_of_measurement ?? ""));
    const powerSensors = [...new Map([...byClass("power"), ...sensors.filter(isPowerUnit)].map((e) => [e.entity_id, e])).values()];
    const pvRe = /pv|solar|photovoltaik|fotovoltaik|balkonkraft|dachkraft|erzeugung|einspeisung|wechselrichter|inverter|fronius|solaredge|huawei|sma\b|growatt|ios/i;
    const useRe = /haus|verbrauch|house|consumption|netzeinspeisung|bezug|grid|netz/i;
    const autoPv = powerSensors.find((e) => inName(e, pvRe) && !inName(e, useRe));
    const autoPower =
      powerSensors.find((e) => e !== autoPv && inName(e, useRe)) ?? powerSensors.find((e) => e !== autoPv);
    const pv = (config?.pvEntity ? states[config.pvEntity] : undefined) ?? autoPv;
    const power = (config?.powerEntity ? states[config.powerEntity] : undefined) ?? autoPower;
    return {
      lights: [...d("light"), ...d("switch")].slice(0, 12),
      climate: d("climate").slice(0, 4),
      sensors: [...byClass("temperature"), ...byClass("humidity")].slice(0, 6),
      weather: d("weather")[0],
      pv,
      power,
      today: find("energy", /heute|today|tag/i) ?? byClass("energy")[0],
      battery: find("battery", /batterie|battery|speicher|akku/i),
      cameras: d("camera").slice(0, 4),
      security: [
        ...d("alarm_control_panel"),
        ...d("lock"),
        ...d("binary_sensor").filter((e) => ["door", "window", "motion", "garage_door"].includes(e.attributes.device_class)),
      ].slice(0, 10),
      smoke: d("binary_sensor").filter((e) => e.attributes.device_class === "smoke").slice(0, 12),
    };
  }, [states, config]);

  const hour = now?.getHours() ?? 12;
  const greeting = hour < 11 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";
  const lightsOn = g.lights.filter((e) => e.state === "on").length;
  const openSec = g.security.filter((e) => e.state === "on" || e.state === "unlocked").length;
  const smokeAlarm = g.smoke.filter((e) => e.state === "on").length;

  const statusLabel = { demo: "Demo-Modus", connecting: "Verbinde …", connected: "Verbunden", error: error ?? "Fehler" }[status];

  return (
    <main className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-8 p-6 lg:p-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">
            {now?.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" }) ?? "\u00a0"}
          </p>
          <h1 className="mt-2 font-display text-5xl font-light lg:text-6xl">
            {greeting}
            <span className="text-primary">.</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            {lightsOn} {lightsOn === 1 ? "Licht ist" : "Lichter sind"} an · {openSec === 0 ? "Alles geschlossen" : `${openSec} offen`} · {smokeAlarm === 0 ? "Rauchmelder bereit" : `Rauchalarm: ${smokeAlarm}`}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <span className="font-display text-6xl font-light tabular-nums lg:text-7xl">
            {now?.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) ?? "--:--"}
          </span>
          <button onClick={() => setOpen(true)} className="tile flex items-center gap-2 px-4 py-3 text-sm">
            <span
              className={cn(
                "size-2 rounded-full",
                status === "connected" ? "bg-success" : status === "error" ? "bg-destructive" : "bg-primary",
              )}
            />
            {statusLabel}
            <Settings className="size-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-8 lg:col-span-8">
          <ActivityOverview groups={g} call={callService} />
          {g.sensors.length > 0 && (
            <Section title="Temperatur & Luftfeuchte">
              <div className="grid gap-3 md:grid-cols-2">
                {g.sensors.map((e) => <SensorChip key={e.entity_id} e={e} />)}
              </div>
            </Section>
          )}
          {g.cameras.length > 0 && (
            <Section title="Kameras">
              <div className="grid gap-4 md:grid-cols-2">
                {g.cameras.map((e) => <CameraTile key={e.entity_id} e={e} src={cameraUrl(config, e)} />)}
              </div>
            </Section>
          )}
        </div>
        <aside className="flex flex-col gap-8 lg:col-span-4">
          {g.weather && (
            <Section title="Wetter">
              <WeatherTile e={g.weather} />
            </Section>
          )}
          {(g.power || g.pv) && (
            <Section title="Energie">
              <EnergyTile power={g.power} pv={g.pv} today={g.today} battery={g.battery} />
            </Section>
          )}
        </aside>
      </div>
      <SettingsDialog
        key={open ? "o" : "c"}
        open={open}
        onOpenChange={setOpen}
        config={config}
        onSave={(c) => {
          saveConfig(c);
          setConfig(c);
        }}
      />
    </main>
  );
}
