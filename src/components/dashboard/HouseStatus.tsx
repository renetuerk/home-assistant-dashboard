import { CheckCircle2, CircleAlert, DoorClosed, Flame, Lock, Wifi } from "lucide-react";
import type { HassEntity } from "@/lib/ha";
import { cn } from "@/lib/utils";

type StatusItem = {
  label: string;
  value: string;
  ok: boolean;
  icon: typeof CheckCircle2;
};

export function HouseStatus({
  connection,
  security,
  smoke,
  climate,
  water,
}: {
  connection: "demo" | "connecting" | "connected" | "error";
  security: HassEntity[];
  smoke: HassEntity[];
  climate: HassEntity[];
  water: HassEntity[];
}) {
  const locked = security.filter((e) => e.domain === "lock").every((e) => e.state === "locked");
  const openSecurity = security.filter((e) =>
    e.domain === "lock"
      ? e.state !== "locked"
      : e.domain === "cover"
        ? ["open", "opening"].includes(e.state)
        : ["on", "open", "unlocked", "detected"].includes(e.state),
  );
  const smokeOk = smoke.length === 0 || smoke.every((e) => e.state === "off");
  const waterOk = water.length === 0 || water.every((e) => !["on", "detected", "wet", "problem"].includes(e.state));
  const heatingOk = climate.length === 0 || climate.every((e) => !["unavailable", "unknown"].includes(e.state));

  const items: StatusItem[] = [
    { label: "Home Assistant", value: connection === "connected" ? "Verbunden" : connection === "connecting" ? "Verbinde …" : "Problem", ok: connection === "connected", icon: Wifi },
    { label: "Sicherheit", value: openSecurity.length === 0 ? (locked || security.length === 0 ? "Alles geschlossen" : "OK") : `${openSecurity.length} offen`, ok: openSecurity.length === 0, icon: openSecurity.length === 0 ? Lock : DoorClosed },
    { label: "Rauchmelder", value: smoke.length === 0 ? "Nicht erkannt" : smokeOk ? `${smoke.length} bereit` : "Alarm prüfen", ok: smokeOk, icon: Flame },
    ...(water.length > 0 ? [{ label: "Wasser", value: waterOk ? "Alles trocken" : "Leck prüfen", ok: waterOk, icon: CircleAlert }] : []),
    ...(climate.length > 0 ? [{ label: "Heizung", value: heatingOk ? "Bereit" : "Nicht verfügbar", ok: heatingOk, icon: CheckCircle2 }] : []),
  ];

  return (
    <div className="tile flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">Hausstatus</div>
          <div className="text-xs text-muted-foreground">Wichtige Zustände auf einen Blick</div>
        </div>
        <CheckCircle2 className="size-5 text-primary" />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {items.map(({ label, value, ok, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl bg-secondary p-3">
            <Icon className={cn("size-4 shrink-0", ok ? "text-success" : "text-destructive")} />
            <div className="min-w-0">
              <div className="text-sm">{label}</div>
              <div className="truncate text-xs text-muted-foreground">{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
