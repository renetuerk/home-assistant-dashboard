import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Eye, EyeOff, GripVertical, Star } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HassEntity } from "@/lib/ha";
import { ClimateTile, LightTile, Section } from "./Tiles";
import { CoverTile } from "./CoverTile";

type Call = (domain: string, service: string, data: Record<string, any>) => void;

export function WidgetFrame({
  label, editing, hidden, dragging, canMoveLeft, canMoveRight, onShift, onMoveColumn, onToggleHidden, onDragStart, onDragEnd, onDropBefore, children,
}: {
  label: string;
  editing: boolean;
  hidden: boolean;
  dragging: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onShift: (delta: -1 | 1) => void;
  onMoveColumn: (column: "main" | "side") => void;
  onToggleHidden: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropBefore: () => void;
  children: ReactNode;
}) {
  if (!editing) return hidden ? null : <>{children}</>;
  return (
    <div
      draggable
      onDragStart={(ev) => { ev.dataTransfer.effectAllowed = "move"; ev.dataTransfer.setData("text/plain", label); onDragStart(); }}
      onDragEnd={onDragEnd}
      onDragOver={(ev) => ev.preventDefault()}
      onDrop={(ev) => { ev.preventDefault(); onDropBefore(); }}
      className={cn("rounded-xl border border-dashed border-primary/50 p-3", dragging && "opacity-40", hidden && "opacity-60")}
    >
      <div className="mb-3 flex items-center gap-1">
        <GripVertical className="size-5 cursor-grab text-muted-foreground" aria-hidden />
        <span className="flex-1 truncate text-sm font-medium">{label}</span>
        <Button variant="ghost" size="icon" aria-label={`${label} nach links verschieben`} title="Nach links verschieben" disabled={!canMoveLeft} onClick={() => onMoveColumn("main")} className="touch-manipulation"><ArrowLeft /></Button>
        <Button variant="ghost" size="icon" aria-label={`${label} nach rechts verschieben`} title="Nach rechts verschieben" disabled={!canMoveRight} onClick={() => onMoveColumn("side")} className="touch-manipulation"><ArrowRight /></Button>
        <Button variant="ghost" size="icon" aria-label={`${label} nach oben`} onClick={() => onShift(-1)}><ArrowUp /></Button>
        <Button variant="ghost" size="icon" aria-label={`${label} nach unten`} onClick={() => onShift(1)}><ArrowDown /></Button>
        <Button variant="ghost" size="icon" aria-label={hidden ? `${label} einblenden` : `${label} ausblenden`} onClick={onToggleHidden}>
          {hidden ? <EyeOff /> : <Eye />}
        </Button>
      </div>
      {hidden ? <p className="text-sm text-muted-foreground">Ausgeblendet</p> : children}
    </div>
  );
}

export function DropEnd({ onDrop }: { onDrop: () => void }) {
  return (
    <div onDragOver={(ev) => ev.preventDefault()} onDrop={(ev) => { ev.preventDefault(); onDrop(); }} className="min-h-12 rounded-xl border border-dashed border-border text-center text-xs leading-[3rem] text-muted-foreground">
      Hier ablegen
    </div>
  );
}

export function FavoriteTiles({ entities, call }: { entities: HassEntity[]; call: Call }) {
  if (!entities.length) return null;
  return (
    <Section title="Favoriten">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {entities.map((e) => {
          const domain = e.entity_id.split(".")[0];
          if (domain === "cover") return <CoverTile key={e.entity_id} e={e} call={call} />;
          if (domain === "climate") return <ClimateTile key={e.entity_id} e={e} call={call} />;
          return <LightTile key={e.entity_id} e={e} call={call} />;
        })}
      </div>
    </Section>
  );
}

export function FavoritePicker({ candidates, favorites, onToggle }: { candidates: HassEntity[]; favorites: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {candidates.map((e) => {
        const on = favorites.includes(e.entity_id);
        return (
          <Button key={e.entity_id} variant={on ? "secondary" : "ghost"} size="sm" aria-pressed={on} onClick={() => onToggle(e.entity_id)} className="h-auto min-h-9 gap-1 whitespace-normal border border-border text-left">
            <Star className={cn("size-4", on && "fill-primary text-primary")} />
            {String(e.attributes.friendly_name ?? e.entity_id)}
          </Button>
        );
      })}
      {candidates.length === 0 && <p className="text-sm text-muted-foreground">Keine Geräte verfügbar.</p>}
    </div>
  );
}
