"use server";

import { updateTag } from "next/cache";
import { isLive } from "@/lib/config";
import { MENU_TAG } from "@/lib/menu/server";
import { createPublicClient } from "@/lib/supabase/server";
import {
  CHECKOUT_MESSAGES,
  checkoutSchema,
  type CheckoutErrorCode,
  type CheckoutField,
  type CheckoutInput,
  type CheckoutResult,
} from "./checkout";

const FIELD_CODES: Record<string, CheckoutField> = { INVALID_NAME: "name", INVALID_PHONE: "phone", INVALID_NOTES: "notes" };

function fail(code: CheckoutErrorCode, extra: Partial<Extract<CheckoutResult, { ok: false }>> = {}): CheckoutResult {
  return { ok: false, code, message: CHECKOUT_MESSAGES[code], ...extra };
}

/**
 * Places a pickup order. The browser only sends dish ids, quantities and the total it showed;
 * the database prices the order and accepts it only if that total still matches.
 */
export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  // The public demo takes no orders and reads no guest details.
  if (!isLive) return fail("DEMO_MODE");

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<CheckoutField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if ((field === "name" || field === "phone" || field === "notes") && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    if (Object.keys(fieldErrors).length === 0) return fail(parsed.error.issues.some((i) => i.path[0] === "items") ? "EMPTY_ORDER" : "UNKNOWN");
    return fail("INVALID_INPUT", { fieldErrors });
  }
  const { name, phone, notes, items, expectedTotalCents } = parsed.data;

  const { data, error } = await createPublicClient().rpc("place_order", {
    p_items: items.map((item) => ({ dish_id: item.dishId, quantity: item.quantity })),
    p_customer_name: name,
    p_customer_phone: phone,
    p_notes: notes,
    p_expected_total_cents: expectedTotalCents,
  });

  if (error) {
    const field = FIELD_CODES[error.message];
    if (field) return fail("INVALID_INPUT", { fieldErrors: { [field]: field === "phone" ? "Please enter a phone number we can call." : "Please check this field." } });
    if (error.message === "ITEM_UNAVAILABLE" || error.message === "PRICE_CHANGED") {
      // The guest's menu snapshot is out of date: expire it so their next render shows current prices.
      updateTag(MENU_TAG);
      return fail(error.message, { unavailable: error.message === "ITEM_UNAVAILABLE" ? (error.details ?? "").split(",").filter(Boolean) : undefined });
    }
    if (error.message === "ORDERS_PAUSED" || error.message === "RESTAURANT_CLOSED" || error.message === "TOO_MANY_ORDERS" || error.message === "EMPTY_ORDER") {
      return fail(error.message);
    }
    console.error("place_order failed", error);
    return fail("UNKNOWN");
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.order_token) return fail("UNKNOWN");
  return { ok: true, mode: "live", token: row.order_token };
}
