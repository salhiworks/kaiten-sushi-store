/** Kaiten plates are colour-coded by price. There are five plate slots; each carries one price. */
export type PlateTier = 1 | 2 | 3 | 4 | 5;

export const ALLERGENS = ["fish", "shellfish", "fish-roe", "wheat", "egg", "soy", "milk"] as const;
export type Allergen = (typeof ALLERGENS)[number];

export const DISH_TAGS = ["chefs-pick", "vegan"] as const;
export type DishTag = (typeof DISH_TAGS)[number];

export interface Tier {
  id: PlateTier;
  name: string;
  /** "#rrggbb", drawn as the plate ring on the belt, the menu and the cart. */
  color: string;
  /** Integer cents. The only place a price is stored. */
  priceCents: number;
}

export interface MenuCategory {
  id: string;
  label: string;
  labelJa: string;
  description: string;
}

export interface Dish {
  /** Stable identifier shared by the conveyor, the menu, saved carts and orders. */
  id: string;
  name: string;
  nameJa: string;
  description: string;
  category: string;
  tier: PlateTier;
  /** Integer cents, always the price of the dish's plate tier. */
  priceCents: number;
  /** Absolute or root-relative URL of a top-down photo on a transparent square canvas. */
  image: string;
  /** Serving size, e.g. "2 pieces". */
  portion: string;
  allergens: Allergen[];
  tags: DishTag[];
  /** False while sold out: still listed, cannot be ordered. */
  available: boolean;
}

export interface Menu {
  categories: MenuCategory[];
  dishes: Dish[];
  tiers: Tier[];
}

export interface OpeningDay {
  closed: boolean;
  /** "HH:MM", restaurant local time. */
  open: string;
  close: string;
}

export interface RestaurantSettings {
  name: string;
  pickupAddress: string;
  pickupNotes: string;
  phone: string;
  /** IANA time zone the opening hours are written in. */
  timezone: string;
  prepMinutes: number;
  acceptingOrders: boolean;
  pausedMessage: string;
  /** Monday first. */
  openingHours: OpeningDay[];
}
