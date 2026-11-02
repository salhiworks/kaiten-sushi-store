import "server-only";

import { cache } from "react";
import type { Allergen, DishTag, MenuCategory, OpeningDay, PlateTier, RestaurantSettings, Tier } from "@/lib/menu";
import { dishImageUrl } from "@/lib/menu/images";
import { getAdminSession as loadSession } from "./auth";
import type { OrderStatus } from "./schemas";

/** One session lookup per request, shared by the dashboard layout and the page. */
export const getAdminSession = cache(loadSession);

type Db = Extract<Awaited<ReturnType<typeof loadSession>>, { status: "admin" }>["db"];

export interface AdminDish {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  category: string;
  tier: PlateTier;
  portion: string;
  allergens: Allergen[];
  tags: DishTag[];
  available: boolean;
  visible: boolean;
  imagePath: string | null;
  imageUrl: string;
}

export interface AdminOrder {
  id: string;
  reference: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  notes: string;
  totalCents: number;
  createdAt: string;
  items: { name: string; quantity: number; lineTotalCents: number }[];
}

const DISH_COLUMNS = "id, name, name_ja, description, category_id, tier_id, portion, allergens, tags, is_available, is_visible, image_path";

type DishRow = {
  id: string; name: string; name_ja: string; description: string; category_id: string; tier_id: number; portion: string;
  allergens: string[]; tags: string[]; is_available: boolean; is_visible: boolean; image_path: string | null;
};

function toAdminDish(d: DishRow): AdminDish {
  return {
    id: d.id,
    name: d.name,
    nameJa: d.name_ja,
    description: d.description,
    category: d.category_id,
    tier: d.tier_id as PlateTier,
    portion: d.portion,
    allergens: d.allergens as Allergen[],
    tags: d.tags as DishTag[],
    available: d.is_available,
    visible: d.is_visible,
    imagePath: d.image_path,
    imageUrl: dishImageUrl(d.image_path),
  };
}

export async function getMenuForAdmin(db: Db) {
  const [tiers, categories, dishes] = await Promise.all([
    db.from("plate_tiers").select("id, name, color, price_cents").order("id"),
    db.from("categories").select("id, label, label_ja, description").order("sort_order").order("label"),
    db.from("dishes").select(DISH_COLUMNS).order("sort_order").order("name"),
  ]);
  const failed = tiers.error ?? categories.error ?? dishes.error;
  if (failed) throw new Error(failed.message);
  return {
    tiers: (tiers.data ?? []).map((t): Tier => ({ id: t.id as PlateTier, name: t.name, color: t.color, priceCents: t.price_cents })),
    categories: (categories.data ?? []).map((c): MenuCategory => ({ id: c.id, label: c.label, labelJa: c.label_ja, description: c.description })),
    dishes: (dishes.data ?? []).map(toAdminDish),
  };
}

export async function getDishForAdmin(db: Db, id: string) {
  const { data, error } = await db.from("dishes").select(DISH_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toAdminDish(data) : null;
}

export async function getSettingsForAdmin(db: Db): Promise<RestaurantSettings> {
  const { data, error } = await db
    .from("restaurant_settings")
    .select("name, pickup_address, pickup_notes, phone, timezone, prep_minutes, accepting_orders, paused_message, opening_hours")
    .single();
  if (error) throw new Error(error.message);
  return {
    name: data.name,
    pickupAddress: data.pickup_address,
    pickupNotes: data.pickup_notes,
    phone: data.phone,
    timezone: data.timezone,
    prepMinutes: data.prep_minutes,
    acceptingOrders: data.accepting_orders,
    pausedMessage: data.paused_message,
    openingHours: data.opening_hours as OpeningDay[],
  };
}

export const ORDER_VIEWS = {
  active: { label: "Active", statuses: ["new", "preparing", "ready"] as OrderStatus[], oldestFirst: true },
  collected: { label: "Collected", statuses: ["collected"] as OrderStatus[], oldestFirst: false },
  cancelled: { label: "Cancelled", statuses: ["cancelled"] as OrderStatus[], oldestFirst: false },
} as const;
export type OrderView = keyof typeof ORDER_VIEWS;

export async function getOrdersForAdmin(db: Db, view: OrderView) {
  const { statuses, oldestFirst } = ORDER_VIEWS[view];
  const [list, ...counts] = await Promise.all([
    db
      .from("orders")
      .select("id, reference, status, customer_name, customer_phone, notes, total_cents, created_at, order_items (dish_name, quantity, line_total_cents, id)")
      .in("status", statuses)
      .order("created_at", { ascending: oldestFirst })
      .limit(100),
    ...Object.values(ORDER_VIEWS).map((v) => db.from("orders").select("id", { count: "exact", head: true }).in("status", v.statuses)),
  ]);
  if (list.error) throw new Error(list.error.message);
  const orders: AdminOrder[] = (list.data ?? []).map((o) => ({
    id: o.id,
    reference: o.reference,
    status: o.status as OrderStatus,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    notes: o.notes,
    totalCents: o.total_cents,
    createdAt: o.created_at,
    items: [...(o.order_items ?? [])]
      .sort((a, b) => a.id - b.id)
      .map((i) => ({ name: i.dish_name, quantity: i.quantity, lineTotalCents: i.line_total_cents })),
  }));
  const viewKeys = Object.keys(ORDER_VIEWS) as OrderView[];
  return { orders, counts: Object.fromEntries(viewKeys.map((key, i) => [key, counts[i].count ?? 0])) as Record<OrderView, number> };
}
