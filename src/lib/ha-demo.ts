import type { HassEntity } from "./ha";

const e = (entity_id: string, state: string, attributes: Record<string, any> = {}): HassEntity => ({
  entity_id,
  state,
  attributes,
});

const list: HassEntity[] = [
  e("light.wohnzimmer", "on", { friendly_name: "Wohnzimmer", brightness: 200 }),
  e("light.kueche", "off", { friendly_name: "Küche", brightness: 0 }),
  e("light.esstisch", "on", { friendly_name: "Esstisch", brightness: 120 }),
  e("light.schlafzimmer", "off", { friendly_name: "Schlafzimmer" }),
  e("light.flur", "off", { friendly_name: "Flur" }),
  e("switch.kaffeemaschine", "off", { friendly_name: "Kaffeemaschine" }),
  e("climate.wohnzimmer", "heat", {
    friendly_name: "Wohnzimmer",
    current_temperature: 21.4,
    temperature: 22,
    min_temp: 7,
    max_temp: 30,
    hvac_action: "heating",
  }),
  e("climate.schlafzimmer", "heat", {
    friendly_name: "Schlafzimmer",
    current_temperature: 18.2,
    temperature: 18.5,
    min_temp: 7,
    max_temp: 30,
    hvac_action: "idle",
  }),
  e("sensor.bad_temperatur", "22.8", { friendly_name: "Bad", device_class: "temperature", unit_of_measurement: "°C" }),
  e("sensor.wohnzimmer_luftfeuchte", "48", { friendly_name: "Luftfeuchte Wohnzimmer", device_class: "humidity", unit_of_measurement: "%" }),
  e("sensor.hausverbrauch", "642", { friendly_name: "Hausverbrauch", device_class: "power", unit_of_measurement: "W" }),
  e("sensor.pv_leistung", "1870", { friendly_name: "PV-Leistung", device_class: "power", unit_of_measurement: "W" }),
  e("sensor.energie_heute", "7.4", { friendly_name: "Verbrauch heute", device_class: "energy", unit_of_measurement: "kWh" }),
  e("sensor.batterie", "76", { friendly_name: "Hausbatterie", device_class: "battery", unit_of_measurement: "%" }),
  e("weather.zuhause", "partlycloudy", {
    friendly_name: "Zuhause",
    temperature: 14,
    humidity: 71,
    wind_speed: 12,
    temperature_unit: "°C",
  }),
  e("camera.eingang", "idle", { friendly_name: "Eingang" }),
  e("camera.garten", "idle", { friendly_name: "Garten" }),
  e("lock.haustuer", "locked", { friendly_name: "Haustür" }),
  e("binary_sensor.terrassentuer", "off", { friendly_name: "Terrassentür", device_class: "door" }),
  e("binary_sensor.kuechenfenster", "on", { friendly_name: "Küchenfenster", device_class: "window" }),
  e("binary_sensor.bewegung_flur", "off", { friendly_name: "Bewegung Flur", device_class: "motion" }),
  e("binary_sensor.rauchmelder_flur", "off", { friendly_name: "Rauchmelder Flur", device_class: "smoke", battery_level: 91 }),
  e("binary_sensor.rauchmelder_kueche", "off", { friendly_name: "Rauchmelder Küche", device_class: "smoke", battery_level: 84 }),
  e("binary_sensor.rauchmelder_schlafzimmer", "off", { friendly_name: "Rauchmelder Schlafzimmer", device_class: "smoke", battery_level: 78 }),
  e("binary_sensor.rauchmelder_gäste_wc", "off", { friendly_name: "Rauchmelder Gäste-WC", device_class: "smoke" }),
  e("alarm_control_panel.alarm", "disarmed", { friendly_name: "Alarmanlage" }),
];

export const demoStates: Record<string, HassEntity> = Object.fromEntries(list.map((x) => [x.entity_id, x]));
