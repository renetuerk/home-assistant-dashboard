import type { ConnStatus } from "@/lib/ha";

const connectionStatus = {
  demo: { label: "Demo-Modus", color: "text-muted-foreground" },
  connecting: { label: "Verbinde …", color: "text-primary" },
  connected: { label: "Verbunden", color: "text-success" },
  error: { label: "Verbindung fehlgeschlagen", color: "text-destructive" },
} satisfies Record<ConnStatus, { label: string; color: string }>;

export function ConnectionStatusIndicator({ status }: { status: ConnStatus }) {
  const { label, color } = connectionStatus[status];

  return (
    <span
      role="status"
      aria-label={`Home Assistant: ${label}`}
      className={`size-2 shrink-0 rounded-full bg-current ${color}`}
    />
  );
}
