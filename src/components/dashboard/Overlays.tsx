import { useEffect, useState } from "react";
import { Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HassEntity } from "@/lib/ha";

/** Full-screen warning while any smoke detector reports alarm. */
export function SmokeAlarmOverlay({ alarms }: { alarms: HassEntity[] }) {
  const key = alarms.map((e) => e.entity_id).sort().join(",");
  const [dismissed, setDismissed] = useState<string | null>(null);
  if (!key || dismissed === key) return null;
  return (
    <div role="alertdialog" aria-label="Rauchalarm" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-destructive p-10 text-center text-destructive-foreground">
      <Siren className="size-24 animate-pulse" />
      <h2 className="font-display text-7xl">Rauchalarm!</h2>
      <ul className="text-2xl">
        {alarms.map((e) => <li key={e.entity_id}>{e.attributes.friendly_name ?? e.entity_id}</li>)}
      </ul>
      <Button size="lg" variant="secondary" onClick={() => setDismissed(key)}>Gesehen</Button>
    </div>
  );
}

const isNight = (d: Date) => d.getHours() >= 22 || d.getHours() < 6;

/** At night, after a minute without touch, shows a dim clock; a tap brings the dashboard back. */
export function NightClock({ now }: { now: Date | null }) {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const reset = () => { setIdle(false); clearTimeout(t); t = setTimeout(() => setIdle(true), 60_000); };
    reset();
    const ev = ["pointerdown", "keydown"] as const;
    ev.forEach((n) => window.addEventListener(n, reset));
    return () => { clearTimeout(t); ev.forEach((n) => window.removeEventListener(n, reset)); };
  }, []);
  if (!now || !idle || !isNight(now)) return null;
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-background" onPointerDown={() => setIdle(false)}>
      <span className="font-display text-[10rem] font-light leading-none tabular-nums text-primary/60">
        {now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
      </span>
      <span className="mt-4 text-muted-foreground/60">
        {now.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}
      </span>
    </div>
  );
}
