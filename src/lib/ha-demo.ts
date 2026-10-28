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
  e("cover.smart_garage", "open", { friendly_name: "Garagentor", device_class: "garage", supported_features: 11 }),
  e("switch.smart_garage", "off", { friendly_name: "Garagentor Relais" }),
  e("switch.shelly_aioshelly_ble_integration", "on", { friendly_name: "aioshelly_ble_integration" }),
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
  e("sensor.energie_monat", "182.5", { friendly_name: "Verbrauch Monat", device_class: "energy", unit_of_measurement: "kWh" }),
  e("sensor.batterie", "76", { friendly_name: "Hausbatterie", device_class: "battery", unit_of_measurement: "%" }),
  e("person.rene", "home", { friendly_name: "René" }),
  e("person.anna", "not_home", { friendly_name: "Anna" }),
  e("person.ben", "Arbeit", { friendly_name: "Ben" }),
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

const roomOf = (id: string) =>
  /wohnzimmer|esstisch|terrasse/.test(id) ? "Wohnzimmer"
  : /kueche|kaffee/.test(id) ? "Küche"
  : /schlafzimmer/.test(id) ? "Schlafzimmer"
  : /flur|haustuer|eingang|gäste/.test(id) ? "Flur"
  : /bad/.test(id) ? "Bad"
  : undefined;

export const demoAreas: Record<string, string> = Object.fromEntries(
  list.flatMap((x) => (roomOf(x.entity_id) ? [[x.entity_id, roomOf(x.entity_id)!]] : [])),
);
