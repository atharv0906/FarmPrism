export function validListing(quantity: number, available: number, price: number): boolean {
  return [quantity, available, price].every(Number.isFinite) && quantity > 0 && quantity <= available && price > 0;
}
export function validAdvance(percent: number): boolean {
  return Number.isFinite(percent) && percent >= 10 && percent <= 90;
}
export function marketSourceLabel(isDemo: boolean, source: string): string {
  return isDemo ? 'Prototype market fallback' : source;
}
