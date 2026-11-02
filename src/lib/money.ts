/** All prices are stored as integer cents. The demo catalog is priced in USD. */
export const CURRENCY = "USD";

const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY });

export function formatPrice(cents: number) {
  return formatter.format(cents / 100);
}
