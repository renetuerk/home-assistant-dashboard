import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActivitySummary } from "@/components/dashboard/ActivitySummary";

const { summarize } = vi.hoisted(() => ({ summarize: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: () => summarize }));
vi.mock("@/lib/ai-summary.functions", () => ({ summarizeActivity: vi.fn() }));
const id = "binary_sensor.kuechenfenster";
const states = { [id]: { entity_id: id, state: "off", attributes: { friendly_name: "Küchenfenster" } } };

beforeEach(() => {
  localStorage.clear();
  summarize.mockReset();
  localStorage.setItem("ha-dashboard-ai-sensors", JSON.stringify([id]));
});
afterEach(cleanup);

describe("activity summary flow", () => {
  it("sends the saved selected sensors and selected period only", async () => {
    const load = vi.fn().mockResolvedValue({ [id]: [{ t: Date.UTC(2026, 0, 1), s: "on" }] });
    summarize.mockResolvedValue({ text: "Das Fenster wurde geöffnet." });
    render(<ActivitySummary states={states} connection="connected" load={load} />);
    fireEvent.click(screen.getByRole("button", { name: "Zusammenfassen" }));
    await waitFor(() => expect(load).toHaveBeenCalledWith([id], 6));
    await waitFor(() => expect(summarize).toHaveBeenCalledTimes(1));
    expect(summarize.mock.calls[0]?.[0].data.hours).toBe(6);
    expect(summarize.mock.calls[0]?.[0].data.log).toHaveLength(1);
    expect(summarize.mock.calls[0]?.[0].data.log[0]).toContain("Küchenfenster: on");
  });
  it("does not call AI when HA history fails", async () => {
    const load = vi.fn().mockRejectedValue(new Error("Verlauf nicht verfügbar"));
    render(<ActivitySummary states={states} connection="connected" load={load} />);
    fireEvent.click(screen.getByRole("button", { name: "Zusammenfassen" }));
    await screen.findByRole("alert");
    expect(summarize).not.toHaveBeenCalled();
  });
  it("does not call AI without recorded data", async () => {
    const load = vi.fn().mockResolvedValue({ [id]: [] });
    render(<ActivitySummary states={states} connection="connected" load={load} />);
    fireEvent.click(screen.getByRole("button", { name: "Zusammenfassen" }));
    await screen.findByRole("status");
    expect(summarize).not.toHaveBeenCalled();
  });
  it("prevents disconnected requests rather than summarizing fabricated events", () => {
    const load = vi.fn();
    render(<ActivitySummary states={states} connection="error" load={load} />);
    fireEvent.click(screen.getByRole("button", { name: "Zusammenfassen" }));
    expect(load).not.toHaveBeenCalled();
    expect(summarize).not.toHaveBeenCalled();
  });
});