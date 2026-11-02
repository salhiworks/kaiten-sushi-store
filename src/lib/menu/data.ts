import type { Allergen, DishTag, MenuCategory, PlateTier, RestaurantSettings, Tier } from "./types";

/**
 * Demo catalog, used when KAITEN_MODE is not "live". It matches the database seed in
 * supabase/migrations/*_kaiten_seed.sql: dish ids, copy, tiers and details come from the
 * original conveyor demo. Images use the store's own /dishes/<id>.webp paths (see src/lib/menu/photo-sources.ts).
 */

export const DEMO_TIERS: Tier[] = [
  { id: 1, name: "Ash", color: "#97918a", priceCents: 320 },
  { id: 2, name: "Indigo", color: "#325d8c", priceCents: 420 },
  { id: 3, name: "Matcha", color: "#608f50", priceCents: 540 },
  { id: 4, name: "Vermilion", color: "#cc4425", priceCents: 680 },
  { id: 5, name: "Gold", color: "#cd9b3c", priceCents: 850 },
];

export const DEMO_CATEGORIES: MenuCategory[] = [
  { id: "nigiri", label: "Nigiri", labelJa: "握り", description: "A slice of topping pressed onto a small mound of seasoned rice." },
  { id: "rolls", label: "Rolls", labelJa: "巻物", description: "Rolled with nori and rice, cut into rounds." },
  { id: "small-plates", label: "Small plates", labelJa: "小皿", description: "Something to share while the belt comes round." },
  { id: "dessert", label: "Dessert", labelJa: "甘味", description: "A sweet plate to finish." },
];

export interface DemoDish {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  category: string;
  tier: PlateTier;
  image: string;
  portion: string;
  allergens: Allergen[];
  tags: DishTag[];
}

export const DEMO_DISHES: DemoDish[] = [
  { id: "salmon-nigiri", name: "Salmon nigiri", nameJa: "サーモン握り", description: "Two slices of fresh salmon over seasoned rice, with pickled ginger.", category: "nigiri", tier: 2, image: "/dishes/salmon-nigiri.webp", portion: "2 pieces", allergens: ["fish"], tags: ["chefs-pick"] },
  { id: "tuna-nigiri", name: "Tuna nigiri", nameJa: "鮪握り", description: "Lean red tuna over warm rice on a black lacquer plate.", category: "nigiri", tier: 4, image: "/dishes/tuna-nigiri.webp", portion: "2 pieces", allergens: ["fish"], tags: [] },
  { id: "ebi-nigiri", name: "Ebi nigiri", nameJa: "海老握り", description: "Butterflied poached shrimp over rice, tail left on.", category: "nigiri", tier: 2, image: "/dishes/ebi-nigiri.webp", portion: "2 pieces", allergens: ["shellfish"], tags: [] },
  { id: "california-roll", name: "California roll", nameJa: "カリフォルニアロール", description: "Crab, avocado and cucumber, rolled inside out in orange tobiko.", category: "rolls", tier: 3, image: "/dishes/california-roll.webp", portion: "4 pieces", allergens: ["shellfish", "fish-roe"], tags: [] },
  { id: "dragon-roll", name: "Dragon roll", nameJa: "ドラゴンロール", description: "Shrimp tempura roll draped in avocado, finished with eel sauce.", category: "rolls", tier: 5, image: "/dishes/dragon-roll.webp", portion: "4 pieces", allergens: ["shellfish", "wheat"], tags: ["chefs-pick"] },
  { id: "tamago", name: "Tamago nigiri", nameJa: "玉子握り", description: "Sweet rolled omelette tied to rice with a band of nori.", category: "nigiri", tier: 1, image: "/dishes/tamago.webp", portion: "2 pieces", allergens: ["egg"], tags: [] },
  { id: "edamame", name: "Salted edamame", nameJa: "枝豆", description: "A small bowl of steamed soybean pods with flaky sea salt.", category: "small-plates", tier: 1, image: "/dishes/edamame.webp", portion: "1 bowl", allergens: ["soy"], tags: ["vegan"] },
  { id: "mochi", name: "Mochi ice cream", nameJa: "餅アイス", description: "Matcha and strawberry mochi ice cream, one of each.", category: "dessert", tier: 3, image: "/dishes/mochi.webp", portion: "2 pieces", allergens: ["milk"], tags: [] },
];

export const DEMO_SETTINGS: RestaurantSettings = {
  name: "KAITEN",
  pickupAddress: "",
  pickupNotes: "",
  phone: "",
  timezone: "America/New_York",
  prepMinutes: 20,
  acceptingOrders: true,
  pausedMessage: "",
  // Demo mode is always open so the full order flow can be tried at any hour.
  openingHours: Array.from({ length: 7 }, () => ({ closed: false, open: "00:00", close: "23:59" })),
};

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  fish: "Fish",
  shellfish: "Shellfish",
  "fish-roe": "Fish roe",
  wheat: "Wheat",
  egg: "Egg",
  soy: "Soy",
  milk: "Milk",
};

export const TAG_LABELS: Record<DishTag, string> = {
  "chefs-pick": "Chef's pick",
  vegan: "Vegan",
};
