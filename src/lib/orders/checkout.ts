import { z } from "zod";
import { MAX_QUANTITY } from "@/lib/cart/store";

/** Shared by the checkout form and the server action. The database re-checks all of it in place_order(). */
export const checkoutSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(80, "Please keep your name under 80 characters."),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ().-]+$/, "Use digits, spaces and + ( ) - only.")
    .refine((value) => {
      const digits = value.replace(/\D/g, "").length;
      return digits >= 7 && digits <= 15;
    }, "Please enter a phone number we can call."),
  notes: z.string().trim().max(500, "Notes can be up to 500 characters."),
  items: z
    .array(z.object({ dishId: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(60), quantity: z.number().int().min(1).max(MAX_QUANTITY) }))
    .min(1, "Your order is empty.")
    .max(50),
  expectedTotalCents: z.number().int().positive(),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutField = "name" | "phone" | "notes";

export interface ConfirmationItem {
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface OrderConfirmation {
  reference: string;
  status: "new" | "preparing" | "ready" | "collected" | "cancelled";
  createdAt: string;
  customerName: string;
  notes: string;
  totalCents: number;
  items: ConfirmationItem[];
}

export type CheckoutResult =
  | { ok: true; mode: "live"; token: string }
  | {
      ok: false;
      code: CheckoutErrorCode;
      message: string;
      fieldErrors?: Partial<Record<CheckoutField, string>>;
      /** Dish ids that can no longer be ordered. */
      unavailable?: string[];
    };

export type CheckoutErrorCode =
  | "DEMO_MODE"
  | "INVALID_INPUT"
  | "EMPTY_ORDER"
  | "ITEM_UNAVAILABLE"
  | "PRICE_CHANGED"
  | "ORDERS_PAUSED"
  | "RESTAURANT_CLOSED"
  | "TOO_MANY_ORDERS"
  | "UNKNOWN";

export const CHECKOUT_MESSAGES: Record<CheckoutErrorCode, string> = {
  DEMO_MODE: "Ordering is off in this demo store.",
  INVALID_INPUT: "Please check the highlighted details.",
  EMPTY_ORDER: "Your order is empty.",
  ITEM_UNAVAILABLE: "Some plates have just sold out. Remove them to continue.",
  PRICE_CHANGED: "Prices changed since you added these plates. We've updated your order — please check the new total.",
  ORDERS_PAUSED: "The restaurant has paused new orders for now.",
  RESTAURANT_CLOSED: "The restaurant is closed right now, so it can't take orders.",
  TOO_MANY_ORDERS: "Several orders were just placed with this phone number. Please wait a few minutes or call the restaurant.",
  UNKNOWN: "Something went wrong and your order was not placed. Please try again.",
};
