import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { isLive } from "@/lib/config";
import { createPublicClient } from "@/lib/supabase/server";
import { DEMO_CATEGORIES, DEMO_DISHES, DEMO_SETTINGS, DEMO_TIERS } from "./data";
import { dishImageUrl } from "./images";
import type { Allergen, Dish, DishTag, Menu, PlateTier, RestaurantSettings, Tier } from "./types";

export const MENU_TAG = "menu";
export const SETTINGS_TAG = "settings";

/**
 * The public menu: visible dishes, their categories and the five plate tiers. Server components
 * call this and pass the result down, so the conveyor, menu, cart and checkout all price from the
 * same snapshot. Admin edits expire the "menu" tag, so changes show on the next request.
 */
export async function getMenu(): Promise<Menu> {
  "use cache";
  cacheTag(MENU_TAG);
  cacheLife("minutes");

  if (!isLive) {
    const prices = new Map(DEMO_TIERS.map((tier) => [tier.id, tier.priceCents]));
    return {
      categories: DEMO_CATEGORIES,
      tiers: DEMO_TIERS,
      dishes: DEMO_DISHES.map((dish) => ({ ...dish, priceCents: prices.get(dish.tier)!, available: true })),
    };
  }

  const db = createPublicClient();
  const [tiers, categories, dishes] = await Promise.all([
    db.from("plate_tiers").select("id, name, color, price_cents").order("id"),
    db.from("categories").select("id, label, label_ja, description").order("sort_order").order("label"),
    db
      .from("dishes")
      .select("id, name, name_ja, description, category_id, tier_id, image_path, portion, allergens, tags, is_available")
      .order("sort_order")
      .order("name"),
  ]);
  const failed = tiers.error ?? categories.error ?? dishes.error;
  if (failed) throw new Error(`Could not load the menu: ${failed.message}`);

  const tierList: Tier[] = (tiers.data ?? []).map((t) => ({ id: t.id as PlateTier, name: t.name, color: t.color, priceCents: t.price_cents }));
  const prices = new Map(tierList.map((tier) => [tier.id, tier.priceCents]));

  return {
    tiers: tierList,
    categories: (categories.data ?? []).map((c) => ({ id: c.id, label: c.label, labelJa: c.label_ja, description: c.description })),
    dishes: (dishes.data ?? []).map((d): Dish => ({
      id: d.id,
      name: d.name,
      nameJa: d.name_ja,
      description: d.description,
      category: d.category_id,
      tier: d.tier_id as PlateTier,
      priceCents: prices.get(d.tier_id as PlateTier)!,
      image: dishImageUrl(d.image_path),
      portion: d.portion,
      allergens: d.allergens as Allergen[],
      tags: d.tags as DishTag[],
      available: d.is_available,
    })),
  };
}

export async function getRestaurant(): Promise<RestaurantSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("minutes");

  if (!isLive) return DEMO_SETTINGS;

  const { data, error } = await createPublicClient()
    .from("restaurant_settings")
    .select("name, pickup_address, pickup_notes, phone, timezone, prep_minutes, accepting_orders, paused_message, opening_hours")
    .single();
  if (error) throw new Error(`Could not load restaurant settings: ${error.message}`);
  return {
    name: data.name,
    pickupAddress: data.pickup_address,
    pickupNotes: data.pickup_notes,
    phone: data.phone,
    timezone: data.timezone,
    prepMinutes: data.prep_minutes,
    acceptingOrders: data.accepting_orders,
    pausedMessage: data.paused_message,
    openingHours: data.opening_hours,
  };
}
