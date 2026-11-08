import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConnectionStatusIndicator } from "@/components/dashboard/ConnectionStatusIndicator";
import type { ConnStatus } from "@/lib/ha";

describe("ConnectionStatusIndicator", () => {
  it.each([
    ["demo", "Home Assistant: Demo-Modus", "text-muted-foreground"],
    ["connecting", "Home Assistant: Verbinde …", "text-primary"],
    ["connected", "Home Assistant: Verbunden", "text-success"],
    ["error", "Home Assistant: Verbindung fehlgeschlagen", "text-destructive"],
  ] as const)("shows a text-free visual status for %s", (status, label, color) => {
    render(<ConnectionStatusIndicator status={status} />);

    const indicator = screen.getByRole("status", { name: label });
    expect(indicator).toBeEmptyDOMElement();
    expect(indicator).toHaveClass(color);
  });
});
