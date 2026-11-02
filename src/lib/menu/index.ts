import type { Dish, PlateTier } from "./types";

export type * from "./types";
export { ALLERGEN_LABELS, TAG_LABELS } from "./data";

/** One entry per plate tier in use on the menu, cheapest first. */
export function plateTiers(dishes: Dish[]) {
  const tiers = new Map<PlateTier, { tier: PlateTier; priceCents: number; dishes: Dish[] }>();
  for (const dish of dishes) {
    const entry = tiers.get(dish.tier) ?? { tier: dish.tier, priceCents: dish.priceCents, dishes: [] };
    entry.dishes.push(dish);
    tiers.set(dish.tier, entry);
  }
  return [...tiers.values()].sort((a, b) => a.priceCents - b.priceCents || a.tier - b.tier);
}
