import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { SUMMARY_INSTRUCTIONS, summaryInputSchema } from "./ai-summary-input";
import { isActivitySummaryAllowed } from "./ai-summary-rate-limit.server";

export const summarizeActivity = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => summaryInputSchema.parse(input))
  .handler(async ({ data }): Promise<{ text?: string; error?: string }> => {
    if (!data.log.length)
      return {
        text: "Für die ausgewählten Sensoren sind in diesem Zeitraum keine Verlaufsdaten vorhanden.",
      };
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey)
      return {
        error:
          "Lovable AI ist auf diesem Server noch nicht eingerichtet. Die lokale Docker-Einrichtung ist in der Anleitung beschrieben.",
      };
    if (!isActivitySummaryAllowed(getRequest().headers)) {
      return { error: "Zu viele Anfragen – bitte in einer Minute erneut versuchen." };
    }
    try {
      const { createResponsesCall } = await import("./ai-responses.server");
      const { result } = createResponsesCall(
        getRequest(),
        {
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          model: "openai/gpt-6-astra",
        },
        [
          {
            role: "user",
            content: `Verlaufsdaten der letzten ${data.hours} Stunden (Uhrzeit Name: Zustand):\n${data.log.join("\n")}`,
          },
        ],
        SUMMARY_INSTRUCTIONS,
      );
      const text = (await result.text).trim();
      return text ? { text } : { error: "Das Modell hat keine Zusammenfassung geliefert." };
    } catch (err: unknown) {
      const failure = err as
        | { statusCode?: number; lastError?: { statusCode?: number }; responseBody?: string }
        | undefined;
      const status = failure?.statusCode ?? failure?.lastError?.statusCode;
      console.error("summarizeActivity failed", status ?? "unknown");
      if (status === 401)
        return { error: "Lovable AI konnte die Server-Einrichtung nicht bestätigen." };
      if (status === 429)
        return { error: "Zu viele Anfragen – bitte in einer Minute erneut versuchen." };
      if (status === 402)
        return {
          error: "KI-Guthaben aufgebraucht. Bitte im Lovable-Arbeitsbereich Guthaben aufladen.",
        };
      if (status === 403)
        return {
          error:
            "Zugriff auf Lovable AI verweigert. Bitte die Freigabe im Lovable-Arbeitsbereich prüfen.",
        };
      return { error: "Zusammenfassung derzeit nicht möglich." };
    }
  });
