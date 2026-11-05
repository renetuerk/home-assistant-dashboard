import { ShieldCheck, ShieldOff, ShieldQuestion, ShieldAlert, LoaderCircle } from "lucide-react";
import type { ConnStatus, HassEntity } from "@/lib/ha";
import { cameraArmingEntity, cameraArmingStatus } from "@/lib/ha-camera-status";
import { cn } from "@/lib/utils";

export function CameraArmingIndicator({ states, selected, connection }: { states: Record<string, HassEntity>; selected?: string; connection: ConnStatus }) {
  const entity = cameraArmingEntity(states, selected);
  const status = connection === "demo" || connection === "connected" ? cameraArmingStatus(entity) : "unknown";
  const presentation = {
    armed: { label: "Scharf geschaltet", Icon: ShieldCheck, color: "text-success" },
    disarmed: { label: "Nicht scharf geschaltet", Icon: ShieldOff, color: "text-muted-foreground" },
    arming: { label: "Wird scharf geschaltet …", Icon: LoaderCircle, color: "text-primary" },
    pending: { label: "Alarm ausstehend", Icon: ShieldAlert, color: "text-primary" },
    triggered: { label: "Alarm ausgelöst", Icon: ShieldAlert, color: "text-destructive" },
    unknown: { label: "Status unbekannt", Icon: ShieldQuestion, color: "text-muted-foreground" },
  }[status];
  const { Icon } = presentation;
  return <div role="status" aria-label={`Kameras: ${presentation.label}`} className="mt-4 flex min-w-0 items-center gap-2 text-sm" title={entity?.attributes.friendly_name ?? selected}>
    <Icon className={cn("size-4 shrink-0", presentation.color, status === "arming" && "motion-safe:animate-spin")} />
    <span className="min-w-0">Kameras <span className={presentation.color}>· {presentation.label}</span></span>
  </div>;
}