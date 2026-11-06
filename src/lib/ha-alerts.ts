import type { HassEntity } from "@/lib/ha";

export type DashboardAlert = { id: string; title: string; body: string };

const KEY = "ha-dashboard-notifications";
const name = (e: HassEntity) => String(e.attributes.friendly_name ?? e.entity_id);

function alertFor(e: HassEntity): DashboardAlert | null {
  const domain = e.entity_id.split(".")[0];
  const cls = e.attributes.device_class;
  if (domain === "binary_sensor" && cls === "smoke" && e.state === "on") return { id: e.entity_id, title: "Rauchalarm!", body: name(e) };
  if (domain === "alarm_control_panel" && e.state === "triggered") return { id: e.entity_id, title: "Alarm ausgelöst", body: name(e) };
  if (domain === "binary_sensor" && cls === "motion" && e.state === "on" && /kamera|camera|cam\b/i.test(`${e.entity_id} ${name(e)}`)) {
    return { id: e.entity_id, title: "Bewegung erkannt", body: name(e) };
  }
  return null;
}

/** Alerts that became active since `prev`; entities already alarming (or first seen) never re-notify. */
export function newAlerts(prev: Record<string, HassEntity> | null, next: Record<string, HassEntity>): DashboardAlert[] {
  if (!prev) return [];
  return Object.values(next).flatMap((e) => {
    const was = prev[e.entity_id];
    if (!was || alertFor(was)) return [];
    const alert = alertFor(e);
    return alert ? [alert] : [];
  });
}

export function loadNotificationsEnabled(): boolean {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}

export function saveNotificationsEnabled(on: boolean) {
  try { localStorage.setItem(KEY, on ? "1" : "0"); } catch { /* Still usable without browser storage. */ }
}

export const notificationsSupported = () => typeof window !== "undefined" && "Notification" in window;

export async function requestNotifications(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  return (Notification.permission === "granted" ? "granted" : await Notification.requestPermission()) === "granted";
}

export async function showAlert(alert: DashboardAlert) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  const options = { body: alert.body, tag: alert.id, icon: "/icon-192.png", requireInteraction: true };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return void (await reg.showNotification(alert.title, options));
    new Notification(alert.title, options);
  } catch { /* Notifications are best-effort. */ }
}
