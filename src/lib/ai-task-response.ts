export const AI_TASK_EMPTY = "Keine KI-Zusammenfassung verfügbar.";
export const AI_TASK_FAILED = "KI-Zusammenfassung konnte nicht erstellt werden.";

export type AiTaskOutcome = { text: string; error?: undefined } | { error: string; text?: undefined };

// Only for local development/tests; off unless explicitly enabled outside production.
export const AI_TASK_MOCK_ENABLED =
  import.meta.env["VITE_USE_AI_TASK_MOCK"] === "true" && (import.meta.env.DEV || import.meta.env.MODE === "test");

export const AI_TASK_MOCK_RESPONSE = {
  response: {
    data: "Die Energieanalyse der letzten 7 Tage zeigt einen insgesamt guten PV-Eigenverbrauch. Der größte Verbraucher war der Trockner mit 7,2 kWh. Auffällig ist, dass die Poolpumpe an zwei Tagen teilweise während Netzbezug gelaufen ist. Empfehlung: Die Poolpumpe möglichst in die PV-Erzeugungszeit zwischen 11:00 und 15:00 Uhr verschieben.",
  },
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : "");

function formatObject(data: Record<string, unknown>): string {
  const kwh = typeof data["largest_consumer_kwh"] === "number" ? `${data["largest_consumer_kwh"].toLocaleString("de-DE")} kWh` : "";
  const consumer = str(data["largest_consumer"]);
  const lines = [
    str(data["summary"]),
    consumer ? `Größter Verbraucher: ${consumer}${kwh ? ` (${kwh})` : ""}` : "",
    str(data["observation"]) && `Auffällig: ${str(data["observation"])}`,
    str(data["recommendation"]) && `Empfehlung: ${str(data["recommendation"])}`,
  ].filter(Boolean) as string[];
  if (lines.length) return lines.join("\n");
  return Object.values(data).map(str).filter(Boolean).join("\n");
}

/** Normalizes a Home Assistant ai_task.generate_data result without assuming one response shape. */
export function parseAiTaskResult(result: unknown): AiTaskOutcome {
  if (!result || typeof result !== "object") return { error: AI_TASK_FAILED };
  const r = result as { error?: unknown; response?: { data?: unknown } };
  if (r.error) return { error: AI_TASK_FAILED };
  const data = r.response?.data;
  const text = typeof data === "string" ? data.trim()
    : data && typeof data === "object" && !Array.isArray(data) ? formatObject(data as Record<string, unknown>) : "";
  return { text: text || AI_TASK_EMPTY };
}
