import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConsumerRanking } from "@/components/dashboard/ConsumerRanking";

afterEach(cleanup);

describe("consumer ranking display", () => {
  it("uses compact spacing while retaining the comparison details", async () => {
    const load = vi.fn().mockResolvedValue({
      meter: Array.from({ length: 14 }, (_, start) => ({ start, kwh: start < 7 ? 2 : 1 })),
    });
    const states = {
      meter: {
        entity_id: "sensor.meter",
        state: "123",
        attributes: { friendly_name: "Wärmepumpe" },
      },
    };

    render(
      <ConsumerRanking
        ids={["meter"]}
        states={states}
        price={0.3}
        load={load}
        onSettings={() => {}}
      />,
    );

    const ranking = screen.getByRole("region", { name: "Größte Verbraucher" });
    expect(ranking).toHaveClass("p-4");
    expect(await screen.findByText("7 kWh")).toBeInTheDocument();
    expect(ranking.querySelector("ol")).toHaveClass("space-y-2");
    expect(screen.getByText("Vorwoche: 14 kWh")).toBeInTheDocument();
  });
});
