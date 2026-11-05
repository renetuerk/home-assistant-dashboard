import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { HaConfig, HassEntity } from "@/lib/ha";
import { Checkbox } from "@/components/ui/checkbox";
import { consumerMeters } from "@/lib/ha-consumers";
import { cameraArmingCandidates } from "@/lib/ha-camera-status";
import { dashboardStyles, type DashboardStyle } from "@/lib/dashboard-appearance";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SettingsDialog({
  open,
  onOpenChange,
  config,
  onSave,
  style,
  onStyleChange,
  price,
  onPriceChange,
  states,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  config: HaConfig | null;
  onSave: (c: HaConfig | null) => void;
  style: DashboardStyle;
  onStyleChange: (style: DashboardStyle) => void;
  price: number;
  onPriceChange: (price: number) => void;
  states: Record<string, HassEntity>;
}) {
  const [url, setUrl] = useState(config?.url ?? "http://homeassistant.local:8123");
  const [token, setToken] = useState(config?.token ?? "");
  const [pvEntity, setPvEntity] = useState(config?.pvEntity ?? "");
  const [powerEntity, setPowerEntity] = useState(config?.powerEntity ?? "");
  const [todayEntity, setTodayEntity] = useState(config?.todayEntity ?? "");
  const [monthEntity, setMonthEntity] = useState(config?.monthEntity ?? "");
  const [consumerIds, setConsumerIds] = useState(config?.consumerEntityIds ?? []);
  const [cameraArmingEntity, setCameraArmingEntity] = useState(config?.cameraArmingEntity ?? "");
  const meters = consumerMeters(states);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal">Dashboard-Einstellungen</DialogTitle>
          <DialogDescription>
            Token erstellen: Home Assistant → Profil → Sicherheit → „Langlebige Zugangs-Token“. Die Daten bleiben nur
            auf diesem Gerät gespeichert.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 border-b border-border pb-4">
          <label htmlFor="dashboard-style" className="text-sm">Stil</label>
          <Select value={style} onValueChange={(value) => {
            const selected = dashboardStyles.find((item) => item.id === value);
            if (selected) onStyleChange(selected.id);
          }}>
            <SelectTrigger id="dashboard-style"><SelectValue /></SelectTrigger>
            <SelectContent>{dashboardStyles.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent>
          </Select>
          <label htmlFor="energy-price" className="flex flex-col gap-1.5 text-sm">
            Strompreis (€/kWh)
            <Input
              id="energy-price"
              inputMode="decimal"
              defaultValue={String(price).replace(".", ",")}
              onChange={(e) => {
                const value = Number(e.target.value.replace(",", "."));
                if (Number.isFinite(value) && value >= 0) onPriceChange(value);
              }}
              placeholder="0,30"
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Wird für die Stromkosten unter „Energie“ verwendet und gilt sofort – auch im Demo-Modus.
          </p>
        </div>
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
          <label htmlFor="camera-arming-entity" className="text-sm">Kameras · Scharfschaltungsstatus</label>
          <Input id="camera-arming-entity" list="camera-arming-options" value={cameraArmingEntity} onChange={e => setCameraArmingEntity(e.target.value)} placeholder="z. B. alarm_control_panel.kameras" />
          <datalist id="camera-arming-options">{cameraArmingCandidates(states).map(e => <option key={e.entity_id} value={e.entity_id}>{e.attributes.friendly_name ?? e.entity_id}</option>)}</datalist>
          <p className="text-xs text-muted-foreground">Alarm-Entität oder Schalter für die Scharfschaltung. Bei Schaltern bedeutet „an“ scharf. Leer: automatische Erkennung einer eindeutig benannten Kamera-Alarmanlage.</p>
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
          <label className="flex flex-col gap-1.5 text-sm">
            Hausverbrauch heute (kWh, für Stromkosten)
            <Input value={todayEntity} onChange={(e) => setTodayEntity(e.target.value)} placeholder="z. B. sensor.hausverbrauch_heute" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Hausverbrauch Monat (kWh, für Stromkosten)
            <Input value={monthEntity} onChange={(e) => setMonthEntity(e.target.value)} placeholder="z. B. sensor.hausverbrauch_monat" />
          </label>
          <p className="text-xs text-muted-foreground">
            Hier die Entitäts-ID aus Home Assistant eintragen (Einstellungen → Geräte → Sensor → Entität). Leer lassen
            für automatische Erkennung.
          </p>
        </div>
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-sm">Größte Verbraucher · Zählerauswahl</p>
          <div className="max-h-52 space-y-3 overflow-y-auto">
            {[...new Set([...meters.map(e => e.entity_id), ...consumerIds])].map(id => <label key={id} className="flex items-start gap-3 text-sm">
              <Checkbox aria-label={String(states[id]?.attributes.friendly_name ?? id)} checked={consumerIds.includes(id)} onCheckedChange={checked => setConsumerIds(current => checked === true ? [...new Set([...current, id])] : current.filter(value => value !== id))} />
              <span className="min-w-0 break-words">{states[id]?.attributes.friendly_name ?? id}<span className="block break-all text-xs text-muted-foreground">{id}</span></span>
            </label>)}
            {!meters.length && !consumerIds.length && <p className="text-xs text-muted-foreground">Keine Energiezähler mit Verbrauchsstatistik gefunden.</p>}
          </div>
          <p className="text-xs text-muted-foreground">Je Gerät einen Energiezähler auswählen, keine Haus-, PV- oder Summenzähler. Auswahl wird mit „Verbinden“ gespeichert.</p>
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
                ...(todayEntity.trim() ? { todayEntity: todayEntity.trim() } : {}),
                ...(monthEntity.trim() ? { monthEntity: monthEntity.trim() } : {}),
                ...(cameraArmingEntity.trim() ? { cameraArmingEntity: cameraArmingEntity.trim() } : {}),
                consumerEntityIds: consumerIds,
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
