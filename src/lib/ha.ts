import { useCallback, useEffect, useRef, useState } from "react";
import { demoStates } from "./ha-demo";

export type HassEntity = {
  entity_id: string;
  state: string;
  attributes: any;
  last_changed?: string;
};

export type HaConfig = { url: string; token: string };
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

export function useHomeAssistant(config: HaConfig | null) {
  const [states, setStates] = useState<Record<string, HassEntity>>(demoStates);
  const [status, setStatus] = useState<ConnStatus>("demo");
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const idRef = useRef(1);

  useEffect(() => {
    if (!config?.url || !config?.token) {
      setStates(demoStates);
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
          send({ id: idRef.current++, type: "get_states" });
          send({ id: idRef.current++, type: "subscribe_events", event_type: "state_changed" });
        } else if (msg.type === "result" && Array.isArray(msg.result)) {
          const map: Record<string, HassEntity> = {};
          for (const e of msg.result as HassEntity[]) map[e.entity_id] = e;
          setStates(map);
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
  }, [config?.url, config?.token]);

  const callService = useCallback(
    (domain: string, service: string, data: Record<string, any>) => {
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
          if (service === "turn_on") state = "on";
          if (service === "turn_off") state = "off";
          if (service === "lock") state = "locked";
          if (service === "unlock") state = "unlocked";
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

  return { states, status, error, callService };
}

export function cameraUrl(config: HaConfig | null, e: HassEntity) {
  if (!config?.url || !e.attributes.entity_picture) return null;
  return config.url.replace(/\/+$/, "") + e.attributes.entity_picture;
}
