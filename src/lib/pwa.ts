const KIOSK_KEY = "ha-dashboard-kiosk";

export function loadKiosk(): boolean {
  try {
    const param = new URLSearchParams(window.location.search).get("kiosk");
    if (param === "1") return true;
    if (param === "0") return false;
    return localStorage.getItem(KIOSK_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveKiosk(on: boolean) {
  try { localStorage.setItem(KIOSK_KEY, on ? "1" : "0"); } catch { /* Still usable without browser storage. */ }
}

export async function setFullscreen(on: boolean) {
  try {
    if (on && !document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    else if (!on && document.fullscreenElement) await document.exitFullscreen();
  } catch { /* Needs a user gesture; kiosk layout still applies. */ }
}

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => { /* Optional enhancement. */ });
}
