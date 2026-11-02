import { z } from "zod";
import { ALLERGENS, DISH_TAGS } from "@/lib/menu/types";

/** Validation shared by the admin forms and the server actions. The database enforces the same limits. */

const slug = z
  .string()
  .trim()
  .min(1, "Required.")
  .max(60, "Keep it under 60 characters.")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single dashes.");

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Bundled images ("/dishes/x.webp") or objects uploaded to the dish-images bucket ("dishes/x-123.webp"). */
export const IMAGE_PATH = /^(\/dishes\/[a-z0-9-]+\.(webp|png|svg)|dishes\/[a-z0-9-]+\.(png|webp|jpg|jpeg|avif))$/;

export const dishSchema = z.object({
  id: slug,
  name: z.string().trim().min(1, "Give the dish a name.").max(80, "Keep the name under 80 characters."),
  nameJa: z.string().trim().max(40, "Keep it under 40 characters."),
  description: z.string().trim().max(300, "Keep the description under 300 characters."),
  category: slug,
  tier: z.number().int().min(1).max(5),
  portion: z.string().trim().max(40, "Keep it under 40 characters."),
  allergens: z.array(z.enum(ALLERGENS)),
  tags: z.array(z.enum(DISH_TAGS)),
  available: z.boolean(),
  visible: z.boolean(),
  imagePath: z.string().regex(IMAGE_PATH, "Upload a PNG, WebP, JPEG or AVIF photo.").nullable(),
});
export type DishInput = z.input<typeof dishSchema>;

export const tiersSchema = z
  .array(
    z.object({
      id: z.number().int().min(1).max(5),
      name: z.string().trim().min(1, "Name each plate colour.").max(40),
      color: z.string().trim().toLowerCase().regex(/^#[0-9a-f]{6}$/, "Pick a colour."),
      priceCents: z.number().int().min(1, "Prices must be above zero.").max(100_000, "Prices must be under $1,000."),
    }),
  )
  .length(5)
  .refine((tiers) => new Set(tiers.map((t) => t.id)).size === 5, "Each plate slot must appear once.");
export type TierInput = z.input<typeof tiersSchema>[number];

export const categorySchema = z.object({
  id: slug,
  label: z.string().trim().min(1, "Give the category a name.").max(40),
  labelJa: z.string().trim().max(20),
  description: z.string().trim().max(200),
});
export type CategoryInput = z.input<typeof categorySchema>;

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 11:30.");

export function isTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const settingsSchema = z.object({
  name: z.string().trim().min(1, "The restaurant needs a name.").max(40),
  pickupAddress: z.string().trim().max(200),
  pickupNotes: z.string().trim().max(300),
  phone: z.string().trim().max(40),
  timezone: z.string().refine(isTimeZone, "Choose a time zone."),
  prepMinutes: z.number().int().min(5, "At least 5 minutes.").max(240, "At most 4 hours."),
  acceptingOrders: z.boolean(),
  pausedMessage: z.string().trim().max(200),
  openingHours: z
    .array(z.object({ closed: z.boolean(), open: time, close: time }))
    .length(7)
    .superRefine((days, ctx) => {
      days.forEach((day, index) => {
        if (!day.closed && day.close <= day.open) ctx.addIssue({ code: "custom", path: [index], message: "Closing time must be after opening time." });
      });
    }),
});
export type SettingsInput = z.input<typeof settingsSchema>;

export const ORDER_STATUSES = ["new", "preparing", "ready", "collected", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type ActionResult = { ok: true } | { ok: false; error: string };

export function firstIssue(error: z.ZodError) {
  const issue = error.issues[0];
  return issue?.message ?? "Please check the form.";
}
