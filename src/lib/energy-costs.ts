const KEY = "ha-dashboard-energy-price";
export const DEFAULT_ENERGY_PRICE = 0.3;

/** Electricity price in €/kWh, stored per device so it survives connection changes. */
export function loadEnergyPrice(): number {
  try {
    const saved = Number(localStorage.getItem(KEY));
    return Number.isFinite(saved) && saved > 0 ? saved : DEFAULT_ENERGY_PRICE;
  } catch {
    return DEFAULT_ENERGY_PRICE;
  }
}

export function saveEnergyPrice(price: number) {
  try {
    localStorage.setItem(KEY, String(price));
  } catch {
    /* Still usable without browser storage. */
  }
}

export function energyCost(kwh: number, pricePerKwh: number): number {
  return kwh * pricePerKwh;
}

export function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}
