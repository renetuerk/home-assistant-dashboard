import { describe, expect, it } from "vitest";
import { AI_TASK_EMPTY, AI_TASK_FAILED, AI_TASK_MOCK_RESPONSE, parseAiTaskResult } from "@/lib/ai-task-response";

describe("parseAiTaskResult", () => {
  it("uses string data directly", () => {
    expect(parseAiTaskResult(AI_TASK_MOCK_RESPONSE).text).toBe(AI_TASK_MOCK_RESPONSE.response.data);
  });
  it("merges structured data", () => {
    const text = parseAiTaskResult({ response: { data: { summary: "Gesunken.", largest_consumer: "Trockner", largest_consumer_kwh: 7.2, observation: "Pool lief.", recommendation: "Mittags." } } }).text;
    expect(text).toBe("Gesunken.\nGrößter Verbraucher: Trockner (7,2 kWh)\nAuffällig: Pool lief.\nEmpfehlung: Mittags.");
  });
  it("falls back to string fields of unknown objects", () => {
    expect(parseAiTaskResult({ response: { data: { foo: "bar" } } }).text).toBe("bar");
  });
  it.each([[{ response: { data: "" } }], [{ response: { data: null } }], [{ response: {} }], [{ response: { data: {} } }]])("reports empty content %#", (r) => {
    expect(parseAiTaskResult(r)).toEqual({ text: AI_TASK_EMPTY });
  });
  it.each([[{ error: "AI Task konnte nicht ausgeführt werden" }], [null], [undefined]])("reports failures %#", (r) => {
    expect(parseAiTaskResult(r)).toEqual({ error: AI_TASK_FAILED });
  });
});
