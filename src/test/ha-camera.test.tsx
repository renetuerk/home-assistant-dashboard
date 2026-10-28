import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CameraTile } from "@/components/dashboard/CameraTile";
import { cameraUrl } from "@/lib/ha";

const e = { entity_id: "camera.garage", state: "idle", attributes: { friendly_name: "Garage", entity_picture: "/api/camera_proxy/camera.garage?token=camera-only" } };
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
describe("Home Assistant camera images", () => {
  it("preserves the camera token without including the login token", () => {
    expect(cameraUrl({ url: "http://ha.local:8123", token: "login-secret" }, e)).toBe("http://ha.local:8123/api/camera_proxy/camera.garage?token=camera-only");
  });
  it("rejects RTSP and off-origin image URLs", () => {
    for (const entity_picture of ["rtsp://ha.local/live", "https://other.test/image"]) {
      expect(cameraUrl({ url: "http://ha.local:8123", token: "login-secret" }, { ...e, attributes: { entity_picture } })).toBeNull();
    }
  });
  it("refreshes every ten seconds and preserves the last successful picture on failure", () => {
    vi.useFakeTimers();
    const requests: FakeImage[] = [];
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = "";
      constructor() { requests.push(this); }
    }
    vi.stubGlobal("Image", FakeImage);
    render(<CameraTile e={e} src="http://ha.local:8123/api/camera_proxy/camera.garage?token=camera-only" />);
    expect(requests).toHaveLength(1);
    act(() => requests[0]?.onload?.());
    const initial = screen.getByRole("img").getAttribute("src");
    act(() => vi.advanceTimersByTime(10_000));
    expect(requests).toHaveLength(2);
    expect(requests[1]?.src).not.toBe(initial);
    act(() => requests[1]?.onerror?.());
    expect(screen.getByRole("img").getAttribute("src")).toBe(initial);
    expect(screen.getByText("Garage · Letztes Bild")).toBeTruthy();
    expect(requests[1]?.src).toContain("token=camera-only");
  });
});