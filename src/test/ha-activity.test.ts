import { describe, expect, it } from "vitest";
import { activityOf } from "@/lib/ha-activity";
import type { HassEntity } from "@/lib/ha";

const e = (entity_id: string, state: string, attributes = {}): HassEntity => ({ entity_id, state, attributes });

describe("Device activity", () => {
  it("groups open and moving covers as active, closed covers as inactive", () => {
    for (const state of ["open", "opening", "closing"]) expect(activityOf(e("cover.Smart", state))).toBe("active");
    expect(activityOf(e("cover.Smart", "closed"))).toBe("inactive");
    expect(activityOf(e("cover.Smart", "unavailable"))).toBe("unknown");
  });
  it("puts switched-on devices first and switched-off devices in the inactive group", () => {
    expect(activityOf(e("light.room", "on"))).toBe("active");
    expect(activityOf(e("switch.socket", "off"))).toBe("inactive");
  });
  it("puts triggered sensors first and quiet sensors in the inactive group", () => {
    expect(activityOf(e("binary_sensor.smoke", "on"))).toBe("active");
    expect(activityOf(e("binary_sensor.smoke", "off"))).toBe("inactive");
  });
  it("distinguishes heating from an idle thermostat", () => {
    expect(activityOf(e("climate.room", "heat", { hvac_action: "heating" }))).toBe("active");
    expect(activityOf(e("climate.room", "heat", { hvac_action: "idle" }))).toBe("inactive");
  });
  it("keeps unlocked doors and armed alarms active", () => {
    expect(activityOf(e("lock.door", "unlocked"))).toBe("active");
    expect(activityOf(e("lock.door", "locked"))).toBe("inactive");
    expect(activityOf(e("alarm_control_panel.home", "armed_away"))).toBe("active");
    expect(activityOf(e("alarm_control_panel.home", "disarmed"))).toBe("inactive");
  });
  it("never classifies a missing sensor reading as inactive", () => {
    expect(activityOf(e("binary_sensor.smoke", "unavailable"))).toBe("unknown");
    expect(activityOf(e("binary_sensor.smoke", "unknown"))).toBe("unknown");
  });
});