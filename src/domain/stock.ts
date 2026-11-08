/** Stock is `null` when the caregiver never entered a quantity. */
export type Stock = number | null;

export function applyTaken(stock: Stock, unitsPerDose: number): Stock {
  return stock === null ? null : Math.max(0, stock - unitsPerDose);
}

export function refill(stock: Stock, boxQuantity: number): number {
  return (stock ?? 0) + boxQuantity;
}

export function remainingDoses(stock: number, unitsPerDose: number): number {
  return Math.floor(stock / unitsPerDose);
}

/** `unitsPerDose` 0 means the dose is text, so there is no way to estimate how long the stock lasts. */
export function daysLeft(stock: Stock, unitsPerDose: number, dosesPerDay: number): number | null {
  if (stock === null || unitsPerDose <= 0) return null;
  return Math.floor(remainingDoses(stock, unitsPerDose) / dosesPerDay);
}
