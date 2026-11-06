import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Settings2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { HassEntity } from "@/lib/ha";
import { buildActivityLog, loadAiSensors, saveAiSensors } from "@/lib/activity-log";
import { summarizeActivity } from "@/lib/ai-summary.functions";

const DOMAINS = ["binary_sensor", "sensor", "light", "switch", "lock", "cover", "climate", "person", "alarm_control_panel"];

export function ActivitySummary({ states, load }: {
  states: Record<string, HassEntity>;
  load: (ids: string[], hours: number) => Promise<Record<string, { t: number; s: string }[]>>;
}) {
  const summarize = useServerFn(summarizeActivity);
  const [ids, setIds] = useState<string[]>([]);
  const [hours, setHours] = useState("6");
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  useEffect(() => setIds(loadAiSensors()), []);

  const toggle = (id: string, on: boolean) => {
    const next = on ? [...new Set([...ids, id])] : ids.filter((x) => x !== id);
    setIds(next); saveAiSensors(next);
  };
  const candidates = Object.values(states)
    .filter((e) => DOMAINS.includes(e.entity_id.split(".")[0]!))
    .filter((e) => `${e.attributes.friendly_name ?? ""} ${e.entity_id}`.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => String(a.attributes.friendly_name ?? a.entity_id).localeCompare(String(b.attributes.friendly_name ?? b.entity_id)));

  const run = async () => {
    setBusy(true); setError(""); setText("");
    try {
      const h = Number(hours);
      const log = buildActivityLog(await load(ids, h), states);
      const res = await summarize({ data: { log, hours: h } });
      if (res.error) setError(res.error); else setText(res.text ?? "");
    } catch { setError("Zusammenfassung derzeit nicht möglich."); }
    finally { setBusy(false); }
  };

  return <section aria-label="KI-Zusammenfassung" className="tile flex flex-col gap-4 p-5">
    <div className="flex flex-wrap items-center gap-3">
      <Sparkles className="size-5 text-primary" />
      <h2 className="font-display text-2xl">Was war los?</h2>
      <span className="text-sm text-muted-foreground">{ids.length} Sensoren</span>
      <div className="ml-auto flex items-center gap-2">
        <Select value={hours} onValueChange={setHours}>
          <SelectTrigger className="w-32" aria-label="Zeitraum"><SelectValue /></SelectTrigger>
          <SelectContent>{["1", "3", "6", "12", "24"].map((h) => <SelectItem key={h} value={h}>Letzte {h} h</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="ghost" size="icon" aria-label="Sensoren auswählen" onClick={() => setOpen(true)}><Settings2 /></Button>
        <Button onClick={run} disabled={busy || !ids.length}>{busy ? "Fasst zusammen …" : "Zusammenfassen"}</Button>
      </div>
    </div>
    {!ids.length && <p className="text-sm text-muted-foreground">Wähle über das Zahnrad die Sensoren, deren Aktivität zusammengefasst werden soll.</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {text && <p className="whitespace-pre-line leading-relaxed">{text}</p>}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal">Sensoren für die Zusammenfassung</DialogTitle>
          <DialogDescription>Nur die Zustandsänderungen dieser Sensoren werden an das KI-Modell geschickt.</DialogDescription>
        </DialogHeader>
        <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Suchen …" />
        <div className="max-h-[50dvh] space-y-3 overflow-y-auto">
          {candidates.map((e) => <label key={e.entity_id} className="flex items-start gap-3 text-sm">
            <Checkbox checked={ids.includes(e.entity_id)} onCheckedChange={(c) => toggle(e.entity_id, c === true)} aria-label={String(e.attributes.friendly_name ?? e.entity_id)} />
            <span className="min-w-0 break-words">{e.attributes.friendly_name ?? e.entity_id}<span className="block break-all text-xs text-muted-foreground">{e.entity_id}</span></span>
          </label>)}
        </div>
      </DialogContent>
    </Dialog>
  </section>;
}
