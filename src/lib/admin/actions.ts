"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isLive } from "@/lib/config";
import { DISH_IMAGE_BUCKET, storageObjectPath } from "@/lib/menu/images";
import { MENU_TAG, SETTINGS_TAG } from "@/lib/menu/server";
import { createSessionClient } from "@/lib/supabase/server";
import { requireAdmin } from "./auth";
import {
  categorySchema,
  dishSchema,
  firstIssue,
  ORDER_STATUSES,
  settingsSchema,
  tiersSchema,
  type ActionResult,
  type CategoryInput,
  type DishInput,
  type OrderStatus,
  type SettingsInput,
  type TierInput,
} from "./schemas";

/**
 * Admin mutations. Each one re-checks that the caller is an admin, writes through the admin's own
 * session (so RLS applies), then expires the storefront caches it affects.
 */

type Db = Awaited<ReturnType<typeof requireAdmin>>;

async function run(work: (db: Db) => Promise<ActionResult | void>): Promise<ActionResult> {
  let db: Db;
  try {
    db = await requireAdmin();
  } catch {
    return { ok: false, error: "Your session has ended or you are not an admin. Please sign in again." };
  }
  try {
    const result = await work(db);
    refresh();
    return result ?? { ok: true };
  } catch (error) {
    console.error("Admin action failed", error);
    return { ok: false, error: "Something went wrong while saving. Please try again." };
  }
}

// --- Session -------------------------------------------------------------------------------

const signInSchema = z.object({ email: z.email(), password: z.string().min(1) });

export async function signIn(_: { error?: string } | undefined, form: FormData): Promise<{ error?: string }> {
  if (!isLive) return { error: "There is no admin in the demo store." };
  const parsed = signInSchema.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "Enter your email and password." };
  const db = await createSessionClient();
  const { error } = await db.auth.signInWithPassword(parsed.data);
  if (error) return { error: "That email and password don't match an account." };
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function signOut() {
  const db = await createSessionClient();
  await db.auth.signOut();
  redirect("/admin/login");
}

// --- Orders --------------------------------------------------------------------------------

export async function setOrderStatus(orderId: string, status: OrderStatus): Promise<ActionResult> {
  if (!z.uuid().safeParse(orderId).success || !ORDER_STATUSES.includes(status)) return { ok: false, error: "Unknown order or status." };
  return run(async (db) => {
    const { error, count } = await db.from("orders").update({ status }, { count: "exact" }).eq("id", orderId);
    if (error) throw error;
    if (!count) return { ok: false, error: "That order no longer exists." };
  });
}

export async function setAcceptingOrders(accepting: boolean): Promise<ActionResult> {
  return run(async (db) => {
    const { error } = await db.from("restaurant_settings").update({ accepting_orders: accepting }).eq("id", true);
    if (error) throw error;
    updateTag(SETTINGS_TAG);
  });
}

// --- Dishes --------------------------------------------------------------------------------

function dishRow(dish: ReturnType<typeof dishSchema.parse>) {
  return {
    name: dish.name,
    name_ja: dish.nameJa,
    description: dish.description,
    category_id: dish.category,
    tier_id: dish.tier,
    portion: dish.portion,
    allergens: dish.allergens,
    tags: dish.tags,
    is_available: dish.available,
    is_visible: dish.visible,
    image_path: dish.imagePath,
  };
}

async function removePhoto(db: Db, path: string | null | undefined) {
  const object = storageObjectPath(path);
  if (object) await db.storage.from(DISH_IMAGE_BUCKET).remove([object]);
}

export async function createDish(input: DishInput): Promise<ActionResult> {
  const parsed = dishSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  return run(async (db) => {
    const { data: last } = await db.from("dishes").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { error } = await db.from("dishes").insert({ id: parsed.data.id, sort_order: (last?.sort_order ?? 0) + 10, ...dishRow(parsed.data) });
    if (error?.code === "23505") return { ok: false, error: "Another dish already uses this web name. Choose a different one." };
    if (error?.code === "23503") return { ok: false, error: "Choose a category and plate colour that exist." };
    if (error) throw error;
    updateTag(MENU_TAG);
  });
}

export async function updateDish(input: DishInput): Promise<ActionResult> {
  const parsed = dishSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  return run(async (db) => {
    const { data: before } = await db.from("dishes").select("image_path").eq("id", parsed.data.id).maybeSingle();
    if (!before) return { ok: false, error: "This dish no longer exists." };
    const { error } = await db.from("dishes").update(dishRow(parsed.data)).eq("id", parsed.data.id);
    if (error?.code === "23503") return { ok: false, error: "Choose a category and plate colour that exist." };
    if (error) throw error;
    // The previous photo is only removed once the dish points at the new one.
    if (before.image_path !== parsed.data.imagePath) await removePhoto(db, before.image_path);
    updateTag(MENU_TAG);
  });
}

export async function setDishFlags(dishId: string, flags: { available?: boolean; visible?: boolean }): Promise<ActionResult> {
  return run(async (db) => {
    const patch: { is_available?: boolean; is_visible?: boolean } = {};
    if (typeof flags.available === "boolean") patch.is_available = flags.available;
    if (typeof flags.visible === "boolean") patch.is_visible = flags.visible;
    const { error } = await db.from("dishes").update(patch).eq("id", dishId);
    if (error) throw error;
    updateTag(MENU_TAG);
  });
}

export async function deleteDish(dishId: string): Promise<ActionResult> {
  return run(async (db) => {
    const { data: before } = await db.from("dishes").select("image_path").eq("id", dishId).maybeSingle();
    if (!before) return { ok: false, error: "This dish no longer exists." };
    // Past orders keep their own copy of the dish name and price.
    const { error } = await db.from("dishes").delete().eq("id", dishId);
    if (error) throw error;
    await removePhoto(db, before.image_path);
    updateTag(MENU_TAG);
  });
}

/** Removes a photo uploaded during an edit that was then abandoned or failed to save. */
export async function discardUpload(path: string): Promise<ActionResult> {
  return run(async (db) => {
    const object = storageObjectPath(path);
    if (!object) return;
    // Never delete a photo a dish still uses.
    const { count } = await db.from("dishes").select("id", { count: "exact", head: true }).eq("image_path", object);
    if (!count) await removePhoto(db, object);
  });
}

// --- Plate tiers ---------------------------------------------------------------------------

export async function saveTiers(input: TierInput[]): Promise<ActionResult> {
  const parsed = tiersSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  return run(async (db) => {
    for (const tier of parsed.data) {
      const { error } = await db.from("plate_tiers").update({ name: tier.name, color: tier.color, price_cents: tier.priceCents }).eq("id", tier.id);
      if (error) throw error;
    }
    updateTag(MENU_TAG);
  });
}

// --- Categories ----------------------------------------------------------------------------

export async function createCategory(input: CategoryInput): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  return run(async (db) => {
    const { data: last } = await db.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { id, label, labelJa, description } = parsed.data;
    const { error } = await db.from("categories").insert({ id, label, label_ja: labelJa, description, sort_order: (last?.sort_order ?? 0) + 10 });
    if (error?.code === "23505") return { ok: false, error: "A category with this name already exists." };
    if (error) throw error;
    updateTag(MENU_TAG);
  });
}

export async function updateCategory(input: CategoryInput): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  return run(async (db) => {
    const { id, label, labelJa, description } = parsed.data;
    const { error } = await db.from("categories").update({ label, label_ja: labelJa, description }).eq("id", id);
    if (error) throw error;
    updateTag(MENU_TAG);
  });
}

export async function moveCategory(id: string, direction: -1 | 1): Promise<ActionResult> {
  return run(async (db) => {
    const { data, error } = await db.from("categories").select("id, sort_order").order("sort_order").order("label");
    if (error) throw error;
    const index = data.findIndex((c) => c.id === id);
    const other = data[index + direction];
    if (index < 0 || !other) return;
    // Renumber so every category has a distinct position, then swap the two.
    const order = data.map((c) => c.id);
    [order[index], order[index + direction]] = [order[index + direction], order[index]];
    for (const [position, categoryId] of order.entries()) {
      const { error: updateError } = await db.from("categories").update({ sort_order: (position + 1) * 10 }).eq("id", categoryId);
      if (updateError) throw updateError;
    }
    updateTag(MENU_TAG);
  });
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  return run(async (db) => {
    const { error } = await db.from("categories").delete().eq("id", id);
    if (error?.code === "23503") return { ok: false, error: "Move or remove this category's dishes first." };
    if (error) throw error;
    updateTag(MENU_TAG);
  });
}

// --- Settings ------------------------------------------------------------------------------

export async function saveSettings(input: SettingsInput): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  return run(async (db) => {
    const s = parsed.data;
    const { error } = await db
      .from("restaurant_settings")
      .update({
        name: s.name,
        pickup_address: s.pickupAddress,
        pickup_notes: s.pickupNotes,
        phone: s.phone,
        timezone: s.timezone,
        prep_minutes: s.prepMinutes,
        accepting_orders: s.acceptingOrders,
        paused_message: s.pausedMessage,
        opening_hours: s.openingHours,
      })
      .eq("id", true);
    if (error) throw error;
    updateTag(SETTINGS_TAG);
  });
}
