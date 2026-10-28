import { ArrowDown, ArrowUp, DoorClosed, DoorOpen, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HassEntity } from "@/lib/ha";

export function CoverTile({ e, call }: { e: HassEntity; call: (domain: string, service: string, data: Record<string, any>) => void }) {
  const supported = Number(e.attributes.supported_features ?? 0);
  const available = !["unavailable", "unknown"].includes(e.state);
  const labels: Record<string, string> = { open: "Offen", closed: "Geschlossen", opening: "Öffnet …", closing: "Schließt …", unknown: "Unbekannt", unavailable: "Nicht erreichbar" };
  const Icon = e.state === "closed" ? DoorClosed : DoorOpen;
  return <div className="tile flex min-w-0 flex-col gap-4 p-4">
    <div className="flex items-center gap-3"><Icon className="size-5 shrink-0 text-primary" /><span className="min-w-0 flex-1 break-words font-medium">{e.attributes.friendly_name ?? e.entity_id}</span><span className="text-sm text-muted-foreground">{labels[e.state] ?? e.state}</span></div>
    <div className="flex gap-2">
      <Button variant="secondary" size="icon" title="Öffnen" aria-label={`${e.attributes.friendly_name ?? e.entity_id} öffnen`} disabled={!available || !(supported & 1) || e.state === "open" || e.state === "opening"} onClick={() => call("cover", "open_cover", { entity_id: e.entity_id })}><ArrowUp /></Button>
      <Button variant="secondary" size="icon" title="Stoppen" aria-label={`${e.attributes.friendly_name ?? e.entity_id} stoppen`} disabled={!available || !(supported & 8)} onClick={() => call("cover", "stop_cover", { entity_id: e.entity_id })}><Square /></Button>
      <Button variant="secondary" size="icon" title="Schließen" aria-label={`${e.attributes.friendly_name ?? e.entity_id} schließen`} disabled={!available || !(supported & 2) || e.state === "closed" || e.state === "closing"} onClick={() => call("cover", "close_cover", { entity_id: e.entity_id })}><ArrowDown /></Button>
    </div>
  </div>;
}