import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Settings, MapPin, X, LayoutGrid, Check, Maximize, Minimize, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { loadDashboardStyle, saveDashboardStyle, type DashboardStyle } from "@/lib/dashboard-appearance";
import { loadEnergyPrice, saveEnergyPrice } from "@/lib/energy-costs";
import { loadConfig, saveConfig, useHomeAssistant, type HaConfig, type HassEntity } from "@/lib/ha";
import { DASHBOARD_LAST_UPDATED } from "@/lib/version";
import {
  EnergyCostTile,
  EnergyFlowTile,
  EnergySurplusTile,
  EnergyTile,
  PersonChip,
  Section,
  SensorChip,
  WeatherTile,
} from "@/components/dashboard/Tiles";
import { ActivityOverview } from "@/components/dashboard/ActivityOverview";
import { SettingsDialog } from "@/components/dashboard/SettingsDialog";
import { PvChart } from "@/components/dashboard/PvChart";
import { WeatherForecast } from "@/components/dashboard/WeatherForecast";
import { ConsumptionChart } from "@/components/dashboard/ConsumptionChart";
import { ConsumerRanking } from "@/components/dashboard/ConsumerRanking";
import { ActivitySummary } from "@/components/dashboard/ActivitySummary";
import { NightClock, SmokeAlarmOverlay } from "@/components/dashboard/Overlays";
import { cn } from "@/lib/utils";
import { loadLayout, moveWidget, saveLayout, shiftWidget, toggleFavorite, toggleHidden, WIDGETS, type DashboardLayout, type WidgetId } from "@/lib/dashboard-layout";
import { loadNotificationsEnabled, newAlerts, notificationsSupported, requestNotifications, saveNotificationsEnabled, showAlert } from "@/lib/ha-alerts";
import { loadKiosk, registerServiceWorker, saveKiosk, setFullscreen } from "@/lib/pwa";
import { DropEnd, FavoritePicker, FavoriteTiles, WidgetFrame } from "@/components/dashboard/LayoutEditor";
import { dashboardDevices } from "@/lib/ha-devices";
import { CameraMotionIndicator } from "@/components/dashboard/CameraMotionIndicator";
import { ConnectionStatusIndicator } from "@/components/dashboard/ConnectionStatusIndicator";

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
  const [style, setStyle] = useState<DashboardStyle>("gold");
  const [price, setPrice] = useState(0.3);
  useEffect(() => setStyle(loadDashboardStyle()), []);
  useEffect(() => setPrice(loadEnergyPrice()), []);
  useEffect(() => {
    document.documentElement.dataset["dashboardStyle"] = style;
  }, [style]);
  useEffect(() => setConfig(loadConfig()), []);
  const [layout, setLayout] = useState<DashboardLayout>(() => loadLayout());
  const [editing, setEditing] = useState(false);
  const [dragId, setDragId] = useState<WidgetId | null>(null);
  const [kiosk, setKiosk] = useState(false);
  const [notify, setNotify] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");
  useEffect(() => {
    setLayout(loadLayout());
    setKiosk(loadKiosk());
    setNotify(loadNotificationsEnabled() && notificationsSupported() && Notification.permission === "granted");
    registerServiceWorker();
  }, []);
  const updateLayout = (fn: (l: DashboardLayout) => DashboardLayout) => setLayout((l) => { const n = fn(l); saveLayout(n); return n; });
  const toggleKiosk = () => {
    const on = !kiosk;
    setKiosk(on);
    saveKiosk(on);
    setEditing(false);
    void setFullscreen(on);
  };
  const toggleNotify = async () => {
    setNotifyMessage("");
    if (!notificationsSupported()) {
      setNotifyMessage(
        "Dieser Browser unterstützt keine Benachrichtigungen. Installiere das Dashboard als App oder verwende einen unterstützten Browser.",
      );
      return;
    }
    if (notify) {
      setNotify(false);
      saveNotificationsEnabled(false);
      setNotifyMessage("Benachrichtigungen ausgeschaltet.");
      return;
    }
    const on = await requestNotifications();
    setNotify(on);
    saveNotificationsEnabled(on);
    if (on) {
      setNotifyMessage("Benachrichtigungen aktiviert. Eine Testbenachrichtigung wurde gesendet.");
      void showAlert({
        id: "notifications-enabled",
        title: "Benachrichtigungen aktiviert",
        body: "Testbenachrichtigung – Rauch-, Alarm- und Kamerabewegungen werden gemeldet.",
      });
    } else {
      setNotifyMessage(
        Notification.permission === "denied"
          ? "Benachrichtigungen sind blockiert. Erlaube sie in den Website-Einstellungen deines Browsers."
          : "Benachrichtigungen konnten nicht aktiviert werden.",
      );
    }
  };
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
  const { states, areas, registry, status, error, callService, fetchHistory, fetchStateChanges, fetchForecast, fetchDailyUsage, fetchConsumerUsage, generateAiText } = useHomeAssistant(config);
  const prevStates = useRef<Record<string, HassEntity> | null>(null);
  useEffect(() => {
    // Demo data and half-loaded connections must not trigger alerts.
    const previous = prevStates.current;
    prevStates.current = status === "connected" ? states : null;
    if (notify && status === "connected") newAlerts(previous, states).forEach((a) => void showAlert(a));
  }, [states, status, notify]);
  const [room, setRoom] = useState<string | null>(null);
  const now = useClock();

  const g = useMemo(() => {
    const devices = dashboardDevices(states, registry);
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
    // Energy costs must use household consumption, never PV production/feed-in counters.
    const usage = byClass("energy").filter((e) => !inName(e, pvRe) || inName(e, /verbrauch|consumption|haus|house/i));
    const pick = (re: RegExp) => usage.find((e) => inName(e, re) && inName(e, useRe)) ?? usage.find((e) => inName(e, re));
    const today = (config?.todayEntity ? states[config.todayEntity] : undefined) ?? pick(/heute|today|tag|daily/i) ?? usage[0];
    const month = (config?.monthEntity ? states[config.monthEntity] : undefined) ?? pick(/monat|month/i);
    const pvToday = byClass("energy").find((e) => inName(e, pvRe) && inName(e, /heute|today|tag|daily|ertrag|production/i));
    return {
      lights: devices.lights,
      covers: devices.covers,
      climate: d("climate").slice(0, 4),
      sensors: [...byClass("temperature"), ...byClass("humidity")].slice(0, 6),
      weather: d("weather")[0],
      pv,
      power,
      today,
      month,
      pvToday,
      battery: find("battery", /batterie|battery|speicher|akku/i),
      persons: d("person").slice(0, 8),
      cameras: devices.cameras,
      security: [
        ...d("alarm_control_panel"),
        ...d("lock"),
        ...d("binary_sensor").filter((e) => ["door", "window", "motion", "garage_door"].includes(e.attributes.device_class)),
      ].slice(0, 10),
      smoke: d("binary_sensor").filter((e) => e.attributes.device_class === "smoke").slice(0, 12),
    };
  }, [states, config, registry]);

  const rooms = useMemo(() => {
    const ids = [...g.lights, ...g.climate, ...g.security, ...g.smoke, ...g.covers].map((e) => areas[e.entity_id]).filter((a): a is string => !!a);
    return [...new Set(ids)].sort((a, b) => a.localeCompare(b, "de"));
  }, [g, areas]);
  const shown = useMemo(() => {
    const f = (l: HassEntity[]) => (room ? l.filter((e) => areas[e.entity_id] === room) : l);
    return { lights: f(g.lights), climate: f(g.climate), security: f(g.security), smoke: f(g.smoke), covers: f(g.covers) };
  }, [g, room, areas]);

  const hour = now?.getHours() ?? 12;
  const greeting = hour < 11 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";
  const lightsOn = g.lights.filter((e) => e.state === "on").length;
  const openSec = g.security.filter((e) => e.state === "on" || e.state === "unlocked").length + g.covers.filter(e => ["open", "opening", "closing"].includes(e.state)).length;
  const smokeAlarm = g.smoke.filter((e) => e.state === "on").length;

  const statusLabel = { demo: "Demo-Modus", connecting: "Verbinde …", connected: "Verbunden", error: error ?? "Fehler" }[status];

  const favoriteEntities = layout.favorites.map((id) => states[id]).filter((e): e is HassEntity => !!e);
  const favoriteCandidates = [...g.lights, ...g.covers, ...g.climate];
  const widgets: Record<WidgetId, React.ReactNode> = {
    favorites: (
      <>
        {editing && <FavoritePicker candidates={favoriteCandidates} favorites={layout.favorites} onToggle={(id) => updateLayout((l) => toggleFavorite(l, id))} />}
        <FavoriteTiles entities={favoriteEntities} call={callService} />
      </>
    ),
    devices: <ActivityOverview groups={shown} call={callService} />,
    summary: <ActivitySummary states={states} load={fetchStateChanges} connection={status} generate={generateAiText} />,
    consumers: <ConsumerRanking ids={config ? config.consumerEntityIds ?? [] : ["sensor.waermepumpe_energie", "sensor.trockner_energie", "sensor.kuehlschrank_energie"]} states={states} price={price} load={fetchConsumerUsage} onSettings={() => setOpen(true)} />,
    "climate-sensors": g.sensors.length > 0 && (
            <Section title="Temperatur & Luftfeuchte">
              <div className="grid gap-3 md:grid-cols-2">
                {g.sensors.map((e) => <SensorChip key={e.entity_id} e={e} />)}
              </div>
            </Section>
          ),
    persons: g.persons.length > 0 && (
            <Section title="Anwesenheit">
              <div className="grid gap-3">
                {g.persons.map((e) => <PersonChip key={e.entity_id} e={e} />)}
              </div>
            </Section>
          ),
    weather: g.weather && (
            <Section title="Wetter">
              <WeatherTile e={g.weather} />
               <WeatherForecast entityId={g.weather.entity_id} unit={String(g.weather.attributes.temperature_unit ?? "°C")} load={fetchForecast} />
            </Section>
          ),
    energy: (g.power || g.pv) && (
            <Section title="Energie">
              <EnergyFlowTile power={g.power} pv={g.pv} />
              <EnergySurplusTile states={states} />
              <EnergyTile power={g.power} pv={g.pv} today={g.today} pvToday={g.pvToday} battery={g.battery} />
              <EnergyCostTile today={g.today} month={g.month} price={price} />
              <PvChart pvId={g.pv?.entity_id} powerId={g.power?.entity_id} load={fetchHistory} />
               <ConsumptionChart entityId={g.today?.entity_id} load={fetchDailyUsage} />
            </Section>
          ),
  };

  return (
    <main className={cn("mx-auto flex min-h-screen max-w-[1600px] flex-col gap-8 p-6 lg:p-10", kiosk && "cursor-none select-none")}>
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
          <CameraMotionIndicator states={states} selected={config?.cameraMotionEntity} connection={status} />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-6">
          <span className="font-display text-6xl font-light tabular-nums lg:text-7xl">
            {now?.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) ?? "--:--"}
          </span>
          {kiosk && <ConnectionStatusIndicator status={status} />}
          {!kiosk && <>
            <Button variant="ghost" size="icon" aria-label={editing ? "Anordnen beenden" : "Layout anordnen"} title={editing ? "Fertig" : "Layout anordnen"} onClick={() => setEditing((v) => !v)} className="tile size-11">
              {editing ? <Check /> : <LayoutGrid />}
            </Button>
            <Button variant="ghost" size="icon" aria-label={notify ? "Benachrichtigungen ausschalten" : "Benachrichtigungen einschalten"} aria-pressed={notify} title={notificationsSupported() ? "Benachrichtigungen bei Rauch-, Alarm- und Kamerabewegung (nur solange das Dashboard geöffnet ist)" : "Dieser Browser unterstützt keine Benachrichtigungen"} onClick={() => void toggleNotify()} className="tile size-11">
              {notify ? <Bell className="text-primary" /> : <BellOff />}
            </Button>
          </>}
          <Button variant="ghost" size="icon" aria-label={kiosk ? "Kiosk-Modus beenden" : "Kiosk-Modus starten"} title={kiosk ? "Kiosk-Modus beenden" : "Kiosk-Modus"} onClick={toggleKiosk} className="tile size-11">
            {kiosk ? <Minimize /> : <Maximize />}
          </Button>
          {!kiosk && <Button variant="ghost" onClick={() => setOpen(true)} className="tile flex h-auto items-center gap-2 px-4 py-3 text-sm">
            <span
              className={cn(
                "size-2 rounded-full",
                status === "connected" ? "bg-success" : "bg-destructive",
              )}
            />
            {statusLabel}
            <Settings className="size-4 text-muted-foreground" />
          </Button>}
          <span className="text-xs text-muted-foreground tabular-nums">Zuletzt aktualisiert: {DASHBOARD_LAST_UPDATED}</span>
        </div>
      </header>
      {notifyMessage && (
        <p role="status" className="text-sm text-muted-foreground">
          {notifyMessage}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-12">
        {(["main", "side"] as const).map((column) => (
          <div key={column} className={cn("flex flex-col gap-8", column === "main" ? "lg:col-span-8" : "lg:col-span-4")}>
            {column === "main" && !editing && rooms.length > 1 && (
            <nav aria-label="Räume" className="flex min-w-0 items-center gap-3">
              <MapPin className="size-4 shrink-0 text-primary" />
              <Select value={room ?? "all"} onValueChange={(value) => setRoom(value === "all" ? null : value)}>
                <SelectTrigger aria-label="Raum auswählen" className="h-11 min-w-0 max-w-72 gap-3"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-80 max-w-[calc(100vw-3rem)]">
                  <SelectItem value="all">Alle Räume</SelectItem>
                  {rooms.map((r) => <SelectItem key={r} value={r} className="min-h-11">{r}</SelectItem>)}
                </SelectContent>
              </Select>
              {room ? <Button variant="ghost" size="icon" aria-label="Raumfilter zurücksetzen" title="Alle Räume" onClick={() => setRoom(null)}><X /></Button> : <span className="shrink-0 text-xs text-muted-foreground">{rooms.length} Räume</span>}
            </nav>
          )}
            {layout[column].map((id) => (
              <WidgetFrame
                key={id}
                label={WIDGETS.find((w) => w.id === id)?.label ?? id}
                editing={editing}
                hidden={layout.hidden.includes(id)}
                dragging={dragId === id}
                onShift={(delta) => updateLayout((l) => shiftWidget(l, id, delta))}
                onToggleHidden={() => updateLayout((l) => toggleHidden(l, id))}
                onDragStart={() => setDragId(id)}
                onDragEnd={() => setDragId(null)}
                onDropBefore={() => {
                  if (dragId && dragId !== id) updateLayout((l) => moveWidget(l, dragId, column, l[column].filter((w) => w !== dragId).indexOf(id)));
                  setDragId(null);
                }}
              >
                {widgets[id]}
              </WidgetFrame>
            ))}
            {editing && dragId && <DropEnd onDrop={() => { updateLayout((l) => moveWidget(l, dragId, column, l[column].length)); setDragId(null); }} />}
          </div>
        ))}
      </div>
      <SmokeAlarmOverlay alarms={g.smoke.filter((e) => e.state === "on")} />
      <NightClock now={now} />
      <SettingsDialog
        key={open ? "o" : "c"}
        open={open}
        onOpenChange={setOpen}
        config={config}
        states={states}
        style={style}
        onStyleChange={(value) => { setStyle(value); saveDashboardStyle(value); }}
        price={price}
        onPriceChange={(value) => { setPrice(value); saveEnergyPrice(value); }}
        onSave={(c) => {
          saveConfig(c);
          setConfig(c);
        }}
      />
    </main>
  );
}
