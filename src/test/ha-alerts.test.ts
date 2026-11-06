import { afterEach, describe, expect, it, vi } from "vitest";
import { notificationsSupported, requestNotifications, showAlert } from "@/lib/ha-alerts";

afterEach(() => vi.unstubAllGlobals());

describe("dashboard notifications", () => {
  it("reports unsupported browsers and requests permission when available", async () => {
    expect(notificationsSupported()).toBe(false);
    const requestPermission = vi.fn().mockResolvedValue("granted");
    vi.stubGlobal("Notification", { permission: "default", requestPermission });

    expect(notificationsSupported()).toBe(true);
    await expect(requestNotifications()).resolves.toBe(true);
    expect(requestPermission).toHaveBeenCalledOnce();
  });

  it("does not enable notifications when permission is denied", async () => {
    vi.stubGlobal("Notification", { permission: "denied", requestPermission: vi.fn() });

    await expect(requestNotifications()).resolves.toBe(false);
  });

  it("sends a confirmation through the browser notification API", async () => {
    const NotificationMock = vi.fn();
    Object.assign(NotificationMock, { permission: "granted" });
    vi.stubGlobal("Notification", NotificationMock);

    await showAlert({ id: "notifications-enabled", title: "Enabled", body: "Test" });

    expect(NotificationMock).toHaveBeenCalledWith(
      "Enabled",
      expect.objectContaining({ body: "Test" }),
    );
  });
});
