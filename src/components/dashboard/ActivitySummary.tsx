import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Settings2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { HassEntity, ConnStatus } from "@/lib/ha";
import { buildActivityLog, loadAiSensors, saveAiSensors } from "@/lib/activity-log";
import { SUMMARY_INSTRUCTIONS } from "@/lib/ai-summary-input";
import { summarizeActivity } from "@/lib/ai-summary.functions";

const DOMAINS = ["binary_sensor", "sensor", "light", "switch", "lock", "cover", "climate", "person", "alarm_control_panel"];

export function ActivitySummary({ states, load, connection, generate }: {
  states: Record<string, HassEntity>;
  connection: ConnStatus;
  generate?: (entityId: string, instructions: string, task: string) => Promise<string>;
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
    .filter((e) => DOMAINS.includes(e.entity_id.split(".")[0] ?? ""))
    .filter((e) => `${e.attributes.friendly_name ?? ""} ${e.entity_id}`.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => String(a.attributes.friendly_name ?? a.entity_id).localeCompare(String(b.attributes.friendly_name ?? b.entity_id)));

  const selected = ids.map((id) => states[id]).filter(Boolean) as HassEntity[];

  const run = async () => {
    setBusy(true); setError(""); setText("");
    try {
      const h = Number(hours);
      const log = buildActivityLog(await load(ids, h), states);
      if (!log.length) {
        setText("Für die ausgewählten Sensoren sind in diesem Zeitraum keine Verlaufsdaten vorhanden.");
        return;
      }
      const aiTask = connection === "connected" && generate ? Object.keys(states).find((k) => k.startsWith("ai_task.")) : undefined;
      if (aiTask && generate) {
        setText(await generate(aiTask, SUMMARY_INSTRUCTIONS, `Verlaufsdaten der letzten ${h} Stunden (Uhrzeit Name: Zustand):\n${log.join("\n")}`));
        return;
      }
      const res = await summarize({ data: { log, hours: h } });
      if (res.error) setError(res.error); else setText(res.text ?? "");
    } catch (err) { setError(err instanceof Error ? err.message : "Zusammenfassung derzeit nicht möglich."); }
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
        <Button onClick={run} disabled={busy || !ids.length || !["connected", "demo"].includes(connection)}>{busy ? "Fasst zusammen …" : "Zusammenfassen"}</Button>
      </div>
    </div>
    {!ids.length && <p className="text-sm text-muted-foreground">Wähle über das Zahnrad die Sensoren, deren Aktivität zusammengefasst werden soll.</p>}
    {connection === "demo" && <p className="text-xs text-muted-foreground">Demo · Beispielaktivität, keine echten Hausdaten</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {text && <p role="status" className="whitespace-pre-line break-words leading-relaxed">{text}</p>}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal">Sensoren für die Zusammenfassung</DialogTitle>
          <DialogDescription>Nur Namen, Zustände und Uhrzeiten dieser Sensoren werden für die Zusammenfassung an die KI geschickt – bevorzugt über den AI-Task deiner Home-Assistant-Integration, sonst über Lovable AI. Der Home-Assistant-Token bleibt auf diesem Gerät.</DialogDescription>
        </DialogHeader>
        {ids.length > 0 && <div className="space-y-2">
          <div className="text-sm font-medium">Ausgewählt ({ids.length})</div>
          <div className="flex flex-wrap gap-1.5">
            {ids.map((id) => {
              const entity = states[id];
              const name = String(entity?.attributes.friendly_name ?? id);
              return <div key={id} className="flex max-w-full items-center gap-1 rounded-full border bg-muted/40 px-2.5 py-1 text-xs">
                <span className="min-w-0 truncate" title={name}>{name}</span>
                <button type="button" className="shrink-0 rounded-full p-0.5 hover:bg-muted" aria-label={`${name} abwählen`} onClick={() => toggle(id, false)}>
                  <X className="size-3" />
                </button>
              </div>;
            })}
          </div>
        </div>}
        {!ids.length && <p className="text-sm text-muted-foreground">Noch keine Sensoren ausgewählt.</p>}
        <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Suchen …" />
        <div className="max-h-[50dvh] space-y-3 overflow-y-auto">
          {ids.filter(id => !states[id]).map(id => <label key={id} className="flex items-start gap-3 text-sm">
            <Checkbox checked onCheckedChange={c => toggle(id, c === true)} aria-label={id} />
            <span className="min-w-0 break-all">{id}<span className="block text-xs text-muted-foreground">Nicht verfügbar</span></span>
          </label>)}
          {candidates.map((e) => <label key={e.entity_id} className="flex items-start gap-3 text-sm">
            <Checkbox checked={ids.includes(e.entity_id)} onCheckedChange={(c) => toggle(e.entity_id, c === true)} aria-label={String(e.attributes.friendly_name ?? e.entity_id)} />
            <span className="min-w-0 break-words">{e.attributes.friendly_name ?? e.entity_id}<span className="block break-all text-xs text-muted-foreground">{e.entity_id}</span></span>
          </label>)}
          {!candidates.length && <p className="text-sm text-muted-foreground">Keine passenden Sensoren gefunden.</p>}
        </div>
      </DialogContent>
    </Dialog>
  </section>;
}
