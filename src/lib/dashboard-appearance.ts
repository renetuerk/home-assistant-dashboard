export const dashboardStyles = [
  { id: "gold", label: "Dunkel & Gold" },
  { id: "graphite", label: "Graphit & Eis" },
  { id: "forest", label: "Dunkel & Salbei" },
] as const;

export type DashboardStyle = (typeof dashboardStyles)[number]["id"];
const KEY = "ha-dashboard-style";

export function loadDashboardStyle(): DashboardStyle {
  try {
    const saved = localStorage.getItem(KEY);
    return dashboardStyles.find((style) => style.id === saved)?.id ?? "gold";
  } catch {
    return "gold";
  }
}

export function saveDashboardStyle(style: DashboardStyle) {
  try { localStorage.setItem(KEY, style); } catch { /* Still usable without browser storage. */ }
}