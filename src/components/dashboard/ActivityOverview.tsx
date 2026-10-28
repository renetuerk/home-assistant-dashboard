import { ChevronDown, Activity, Power } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { activityOf } from "@/lib/ha-activity";
import type { HassEntity } from "@/lib/ha";
import { ClimateTile, LightTile, Section, SecurityRow, SmokeRow } from "./Tiles";
import { CoverTile } from "./CoverTile";

type Groups = { lights: HassEntity[]; climate: HassEntity[]; security: HassEntity[]; smoke: HassEntity[]; covers: HassEntity[] };
type Call = (domain: string, service: string, data: Record<string, any>) => void;

function DeviceGroups({ groups, call }: { groups: Groups; call: Call }) {
  return <div className="flex flex-col gap-6">
    {groups.covers.length > 0 && <Section title="Tore & Rollläden"><div className="grid gap-4 md:grid-cols-2">{groups.covers.map(e => <CoverTile key={e.entity_id} e={e} call={call} />)}</div></Section>}
    {groups.smoke.length > 0 && <Section title="Rauchmelder"><div className="grid gap-2 md:grid-cols-2">{groups.smoke.map(e => <SmokeRow key={e.entity_id} e={e} />)}</div></Section>}
    {groups.security.length > 0 && <Section title="Sicherheit"><div className="grid gap-2 md:grid-cols-2">{groups.security.map(e => <SecurityRow key={e.entity_id} e={e} call={call} />)}</div></Section>}
    {groups.lights.length > 0 && <Section title="Licht & Schalter"><div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{groups.lights.map(e => <LightTile key={e.entity_id} e={e} call={call} />)}</div></Section>}
    {groups.climate.length > 0 && <Section title="Klima"><div className="grid gap-4 md:grid-cols-2">{groups.climate.map(e => <ClimateTile key={e.entity_id} e={e} call={call} />)}</div></Section>}
  </div>;
}

export function ActivityOverview({ groups, call }: { groups: Groups; call: Call }) {
  const [expanded, setExpanded] = useState(false);
  const select = (state: ReturnType<typeof activityOf>): Groups => ({
    lights: groups.lights.filter(e => activityOf(e) === state),
    climate: groups.climate.filter(e => activityOf(e) === state),
    security: groups.security.filter(e => activityOf(e) === state),
    smoke: groups.smoke.filter(e => activityOf(e) === state),
    covers: groups.covers.filter(e => activityOf(e) === state),
  });
  const count = (g: Groups) => Object.values(g).reduce((n, list) => n + list.length, 0);
  const active = select("active");
  const inactive = select("inactive");
  const unknown = select("unknown");
  return <div className="flex flex-col gap-8">
    <section aria-label="Jetzt aktiv" className="flex flex-col gap-5">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Activity className="size-5 text-primary" />
        <h2 className="font-display text-3xl">Jetzt aktiv</h2>
        <span className="ml-auto text-sm tabular-nums text-primary">{count(active)}</span>
      </div>
      {count(active) > 0 ? <DeviceGroups groups={active} call={call} /> : <p className="text-muted-foreground">Keine aktiven Geräte oder ausgelösten Melder.</p>}
    </section>
    {count(unknown) > 0 && <section aria-label="Status unbekannt" className="flex flex-col gap-4"><h2 className="font-display text-2xl text-destructive">Status unbekannt · {count(unknown)}</h2><DeviceGroups groups={unknown} call={call} /></section>}
    <Collapsible open={expanded} onOpenChange={setExpanded} className="border-y border-border py-4">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="h-auto w-full justify-start whitespace-normal px-0 py-2 text-left">
          <Power className="text-muted-foreground" />
          <span className="flex-1 font-display text-2xl font-normal">Inaktiv & ausgeschaltet</span>
          <span className="text-muted-foreground tabular-nums">{count(inactive)}</span>
          <ChevronDown className={expanded ? "rotate-180" : ""} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-5">
        {count(inactive) > 0 ? <DeviceGroups groups={inactive} call={call} /> : <p className="text-muted-foreground">Keine inaktiven Geräte.</p>}
      </CollapsibleContent>
    </Collapsible>
  </div>;
}