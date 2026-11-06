import { createServerFn } from "@tanstack/react-start";

type Input = { log: string[]; hours: number };

export const summarizeActivity = createServerFn({ method: "POST" })
  .inputValidator((input: Input) => {
    if (!Array.isArray(input?.log) || input.log.length > 400) throw new Error("Ungültige Eingabe");
    const hours = Math.min(48, Math.max(1, Number(input.hours) || 6));
    return { log: input.log.map((l) => String(l).slice(0, 200)), hours };
  })
  .handler(async ({ data }): Promise<{ text?: string; error?: string }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { error: "KI ist nicht eingerichtet (LOVABLE_API_KEY fehlt auf dem Server)." };
    if (!data.log.length) return { text: `In den letzten ${data.hours} Stunden gab es bei den ausgewählten Sensoren keine Änderungen.` };
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText } = await import("ai");
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        maxRetries: 0,
        system:
          "Du fasst die Aktivität in einem Smart Home für die Bewohner zusammen. Antworte auf Deutsch, freundlich und knapp (3–6 kurze Sätze oder Stichpunkte). Nenne Auffälliges zuerst (offene Türen/Fenster, Alarme, ungewöhnliche Zeiten). Erfinde nichts, was nicht im Protokoll steht; 'unavailable'/'unknown' heißt: Sensor nicht erreichbar.",
        messages: [{ role: "user", content: `Zustandsänderungen der letzten ${data.hours} Stunden (Uhrzeit Name: Zustand):\n${data.log.join("\n")}` }],
        providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
      });
      const text = (await result.text).trim();
      return text ? { text } : { error: "Das Modell hat keine Zusammenfassung geliefert." };
    } catch (err: any) {
      const status = err?.statusCode ?? err?.lastError?.statusCode;
      console.error("summarizeActivity failed", status, err?.message);
      if (status === 429) return { error: "Zu viele Anfragen – bitte in einer Minute erneut versuchen." };
      if (status === 402) return { error: "KI-Guthaben aufgebraucht. Bitte im Lovable-Arbeitsbereich Guthaben aufladen." };
      if (status === 403) return { error: "Zugriff auf das KI-Modell verweigert." };
      return { error: "Zusammenfassung derzeit nicht möglich." };
    }
  });
