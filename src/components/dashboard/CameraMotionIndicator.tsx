import { Activity, Video, CircleHelp } from "lucide-react";
import type { ConnStatus, HassEntity } from "@/lib/ha";
import { cameraMotionEntity, cameraMotionStatus } from "@/lib/ha-camera-motion";
import { cn } from "@/lib/utils";

export function CameraMotionIndicator({ states, selected, connection }: { states: Record<string, HassEntity>; selected?: string | undefined; connection: ConnStatus }) {
  const entity = cameraMotionEntity(states, selected);
  const status = connection === "demo" || connection === "connected" ? cameraMotionStatus(entity) : "unknown";
  const presentation = {
    motion: { label: "Bewegung", Icon: Activity, color: "text-primary" },
    clear: { label: "Keine Bewegung", Icon: Video, color: "text-success" },
    unknown: { label: "Status unbekannt", Icon: CircleHelp, color: "text-muted-foreground" },
  }[status];
  const { Icon } = presentation;
  return <div role="status" aria-label={`Kameras: ${presentation.label}`} className="mt-4 flex min-w-0 items-center gap-2 text-sm" title={entity?.attributes.friendly_name ?? selected}>
    <Icon className={cn("size-4 shrink-0", presentation.color)} />
    <span className="min-w-0">Kameras <span className={presentation.color}>· {presentation.label}</span></span>
  </div>;
}