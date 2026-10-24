import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { HaConfig } from "@/lib/ha";

export function SettingsDialog({
  open,
  onOpenChange,
  config,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  config: HaConfig | null;
  onSave: (c: HaConfig | null) => void;
}) {
  const [url, setUrl] = useState(config?.url ?? "http://homeassistant.local:8123");
  const [token, setToken] = useState(config?.token ?? "");
  const [pvEntity, setPvEntity] = useState(config?.pvEntity ?? "");
  const [powerEntity, setPowerEntity] = useState(config?.powerEntity ?? "");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal">Mit Home Assistant verbinden</DialogTitle>
          <DialogDescription>
            Token erstellen: Home Assistant → Profil → Sicherheit → „Langlebige Zugangs-Token“. Die Daten bleiben nur
            auf diesem Gerät gespeichert.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            Adresse
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://192.168.1.10:8123" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Zugangs-Token
            <Input value={token} onChange={(e) => setToken(e.target.value)} type="password" placeholder="eyJ0eXAi…" />
          </label>
        </div>
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Energie-Sensoren (optional)</p>
          <label className="flex flex-col gap-1.5 text-sm">
            PV-Sensor (Erzeugung)
            <Input value={pvEntity} onChange={(e) => setPvEntity(e.target.value)} placeholder="z. B. sensor.wechselrichter_wirkleistung" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Hausverbrauch-Sensor
            <Input value={powerEntity} onChange={(e) => setPowerEntity(e.target.value)} placeholder="z. B. sensor.hausverbrauch" />
          </label>
          <p className="text-xs text-muted-foreground">
            Hier die Entitäts-ID aus Home Assistant eintragen (Einstellungen → Geräte → Sensor → Entität). Leer lassen
            für automatische Erkennung.
          </p>
        </div>
        <div className="flex justify-between gap-2 pt-2">
          <Button variant="ghost" onClick={() => { onSave(null); onOpenChange(false); }}>
            Demo-Modus
          </Button>
          <Button
            onClick={() => {
              onSave({
                url: url.trim(),
                token: token.trim(),
                ...(pvEntity.trim() ? { pvEntity: pvEntity.trim() } : {}),
                ...(powerEntity.trim() ? { powerEntity: powerEntity.trim() } : {}),
              });
              onOpenChange(false);
            }}
            disabled={!url || !token}
          >
            Verbinden
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
