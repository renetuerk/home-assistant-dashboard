import { useCallback, useEffect, useRef, useState } from "react";
import { demoAreas, demoStates } from "./ha-demo";
import type { EntityRegistryEntry } from "./ha-devices";

export type HassEntity = {
  entity_id: string;
  state: string;
  attributes: any;
  last_changed?: string;
};

export type HaConfig = { url: string; token: string; pvEntity?: string; powerEntity?: string; todayEntity?: string; monthEntity?: string };
export type ConnStatus = "demo" | "connecting" | "connected" | "error";

const KEY = "ha-dashboard-config";

export function loadConfig(): HaConfig | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HaConfig) : null;
  } catch {
    return null;
  }
}
export function saveConfig(cfg: HaConfig | null) {
  if (cfg) localStorage.setItem(KEY, JSON.stringify(cfg));
  else localStorage.removeItem(KEY);
}

export function toWsUrl(url: string) {
  const u = url.trim().replace(/\/+$/, "");
  return u.replace(/^http/, "ws") + "/api/websocket";
}

export type HistoryPoint = { t: number; v: number };

export function useHomeAssistant(config: HaConfig | null) {
  const [states, setStates] = useState<Record<string, HassEntity>>(demoStates);
  const [areas, setAreas] = useState<Record<string, string>>(demoAreas);
  const [registry, setRegistry] = useState<EntityRegistryEntry[]>([]);
  const [status, setStatus] = useState<ConnStatus>("demo");
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const idRef = useRef(1);
  const statesRef = useRef(states);
  statesRef.current = states;
  const pendingRef = useRef(new Map<number, (r: any) => void>());

  const request = useCallback((msg: object) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return Promise.reject(new Error("offline"));
    const id = idRef.current++;
    return new Promise<any>((resolve) => {
      pendingRef.current.set(id, resolve);
      ws.send(JSON.stringify({ id, ...msg }));
    });
  }, []);

  useEffect(() => {
    if (!config?.url || !config?.token) {
      setStates(demoStates);
      setAreas(demoAreas);
      setRegistry([]);
      setStatus("demo");
      return;
    }
    let closed = false;
    let retry: ReturnType<typeof setTimeout>;

    const connect = () => {
      setStatus("connecting");
      let ws: WebSocket;
      try {
        ws = new WebSocket(toWsUrl(config.url));
      } catch (e) {
        setStatus("error");
        setError("Ungültige Adresse");
        return;
      }
      wsRef.current = ws;
      const send = (msg: object) => ws.send(JSON.stringify(msg));

      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.type === "auth_required") send({ type: "auth", access_token: config.token });
        else if (msg.type === "auth_invalid") {
          setStatus("error");
          setError("Token ungültig");
          closed = true;
          ws.close();
        } else if (msg.type === "auth_ok") {
          setStatus("connected");
          setError(null);
          request({ type: "get_states" }).then((result: HassEntity[]) => {
            const map: Record<string, HassEntity> = {};
            for (const e of result ?? []) map[e.entity_id] = e;
            setStates(map);
          });
          send({ id: idRef.current++, type: "subscribe_events", event_type: "state_changed" });
          Promise.all([
            request({ type: "config/area_registry/list" }),
            request({ type: "config/device_registry/list" }),
            request({ type: "config/entity_registry/list" }),
          ])
            .then(([areaList, devices, entities]) => {
              setAreas(buildAreaMap(areaList, devices, entities));
              setRegistry(entities ?? []);
            })
            .catch(() => {});
        } else if (msg.type === "result") {
          const cb = pendingRef.current.get(msg.id);
          if (cb) {
            pendingRef.current.delete(msg.id);
            cb(msg.success === false ? null : msg.result);
          }
        } else if (msg.type === "event" && msg.event?.event_type === "state_changed") {
          const { entity_id, new_state } = msg.event.data;
          setStates((s) => {
            const n = { ...s };
            if (new_state) n[entity_id] = new_state;
            else delete n[entity_id];
            return n;
          });
        }
      };
      ws.onerror = () => {
        setStatus("error");
        setError("Home Assistant nicht erreichbar");
      };
      ws.onclose = () => {
        if (!closed) retry = setTimeout(connect, 5000);
      };
    };
    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      wsRef.current?.close();
    };
  }, [config?.url, config?.token, request]);

  const fetchHistory = useCallback(
    async (entityId: string, hours: number): Promise<HistoryPoint[]> => {
      if (status !== "connected") return demoHistory(Number(statesRef.current[entityId]?.state ?? 0), hours);
      const start = new Date(Date.now() - hours * 3600_000).toISOString();
      const res = await request({
        type: "history/history_during_period",
        start_time: start,
        entity_ids: [entityId],
        minimal_response: true,
        no_attributes: true,
      });
      return ((res?.[entityId] ?? []) as { s: string; lu: number }[])
        .map((p) => ({ t: p.lu * 1000, v: Number(p.s) }))
        .filter((p) => Number.isFinite(p.v));
    },
    [status, request],
  );

  const callService = useCallback(
    (domain: string, service: string, data: any) => {
      const ws = wsRef.current;
      if (status === "connected" && ws?.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({ id: idRef.current++, type: "call_service", domain, service, service_data: data }),
        );
        return;
      }
      // Demo mode: simulate locally
      const ids: string[] = [].concat(data.entity_id ?? []);
      setStates((s) => {
        const n = { ...s };
        for (const id of ids) {
          const e = n[id];
          if (!e) continue;
          let state = e.state;
          const attrs = { ...e.attributes };
          if (service === "toggle") state = state === "on" ? "off" : "on";
          if (state === "on" && !attrs.brightness && "brightness" in attrs) attrs.brightness = 255;
          if (service === "turn_on") state = "on";
          if (service === "turn_off") state = "off";
          if (service === "lock") state = "locked";
          if (service === "unlock") state = "unlocked";
          if (service === "open_cover") state = "open";
          if (service === "close_cover") state = "closed";
          if (data.brightness_pct != null) {
            attrs.brightness = Math.round((data.brightness_pct / 100) * 255);
            state = data.brightness_pct > 0 ? "on" : "off";
          }
          if (data.temperature != null) attrs.temperature = data.temperature;
          if (service.startsWith("alarm_"))
            state = service === "alarm_disarm" ? "disarmed" : service.replace("alarm_", "armed_").replace("arm_", "");
          n[id] = { ...e, state, attributes: attrs };
        }
        return n;
      });
    },
    [status],
  );

  return { states, areas, registry, status, error, callService, fetchHistory };
}

/** Maps entity_id → area name, using the entity's own area or its device's area. */
export function buildAreaMap(areaList: any[], devices: any[], entities: any[]): Record<string, string> {
  const areaName = new Map<string, string>((areaList ?? []).map((a) => [a.area_id, a.name]));
  const deviceArea = new Map<string, string>((devices ?? []).map((d) => [d.id, d.area_id]));
  const out: Record<string, string> = {};
  for (const en of entities ?? []) {
    const id = en.area_id ?? (en.device_id ? deviceArea.get(en.device_id) : undefined);
    const name = id ? areaName.get(id) : undefined;
    if (name) out[en.entity_id] = name;
  }
  return out;
}

function demoHistory(current: number, hours: number): HistoryPoint[] {
  const now = Date.now();
  const pts: HistoryPoint[] = [];
  for (let i = hours * 6; i >= 0; i--) {
    const t = now - i * 600_000;
    const h = new Date(t).getHours() + new Date(t).getMinutes() / 60;
    const sun = Math.max(0, Math.sin(((h - 6) / 14) * Math.PI));
    pts.push({ t, v: Math.round(sun * Math.max(current, 1500) * (0.85 + 0.15 * Math.sin(i))) });
  }
  return pts;
}

export function cameraUrl(config: HaConfig | null, e: HassEntity) {
  if (!config?.url || !e.attributes.entity_picture) return null;
  try {
    const base = new URL(config.url);
    const url = new URL(e.attributes.entity_picture, base);
    // Camera tokens must only be sent to the configured Home Assistant origin.
    return ["http:", "https:"].includes(url.protocol) && url.origin === base.origin ? url.toString() : null;
  } catch {
    return null;
  }
}
