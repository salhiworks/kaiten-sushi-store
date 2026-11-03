/**
 * The demo admin's data: a fictional restaurant kept entirely in this browser's localStorage.
 *
 * Nothing here talks to a server. The demo admin edits this store, and the demo storefront reads
 * it, so visitors can see a price, stock or settings change reach the belt and their order. The
 * same validation as the real admin applies (lib/admin/schemas.ts). "Reset demo" puts it back.
 */
import type { ActionResult, CategoryInput, DishInput, OrderStatus, SettingsInput, TierInput } from "@/lib/admin/schemas";
import { categorySchema, dishSchema, firstIssue, settingsSchema, tiersSchema } from "@/lib/admin/schemas";
import { DEMO_CATEGORIES, DEMO_DISHES, DEMO_TIERS } from "@/lib/menu/data";
import { dishImageUrl } from "@/lib/menu/images";
import type { Allergen, Dish, DishTag, MenuCategory, PlateTier, RestaurantSettings, Tier } from "@/lib/menu/types";

export interface DemoDish {
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
}

export interface DemoOrder {
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

export interface DemoState {
  v: 1;
  tiers: Tier[];
  categories: MenuCategory[];
  dishes: DemoDish[];
  settings: RestaurantSettings;
  orders: DemoOrder[];
}

const STORAGE_KEY = "kaiten:demo";

const DEFAULT_SETTINGS: RestaurantSettings = {
  name: "KAITEN",
  pickupAddress: "",
  pickupNotes: "Collect at the counter by the entrance.",
  phone: "",
  timezone: "America/New_York",
  prepMinutes: 20,
  acceptingOrders: true,
  pausedMessage: "",
  openingHours: [
    ...Array.from({ length: 4 }, () => ({ closed: false, open: "11:30", close: "21:30" })),
    { closed: false, open: "11:30", close: "22:00" },
    { closed: false, open: "11:30", close: "22:00" },
    { closed: false, open: "12:00", close: "21:00" },
  ],
};

// Fictional guests. Phone numbers use 555-01xx, which is reserved for fiction.
const SAMPLE_ORDERS: { minutesAgo: number; status: OrderStatus; name: string; phone: string; notes: string; items: [string, number][] }[] = [
  { minutesAgo: 3, status: "new", name: "Mei Tanaka", phone: "+1 (555) 010-0142", notes: "Extra ginger, please.", items: [["salmon-nigiri", 2], ["edamame", 1]] },
  { minutesAgo: 9, status: "new", name: "Jordan Ellis", phone: "+1 (555) 010-0177", notes: "", items: [["dragon-roll", 1], ["california-roll", 1], ["mochi", 2]] },
  { minutesAgo: 16, status: "preparing", name: "Priya Raman", phone: "+1 (555) 010-0128", notes: "No wasabi on the tuna.", items: [["tuna-nigiri", 2], ["tamago", 1]] },
  { minutesAgo: 27, status: "ready", name: "Lucas Moreau", phone: "+1 (555) 010-0163", notes: "", items: [["ebi-nigiri", 1], ["salmon-nigiri", 1], ["edamame", 1]] },
  { minutesAgo: 95, status: "collected", name: "Hana Kim", phone: "+1 (555) 010-0119", notes: "", items: [["dragon-roll", 2]] },
  { minutesAgo: 140, status: "collected", name: "Sam Okafor", phone: "+1 (555) 010-0185", notes: "Running five minutes late.", items: [["california-roll", 1], ["tuna-nigiri", 1]] },
  { minutesAgo: 210, status: "cancelled", name: "Alex Rivera", phone: "+1 (555) 010-0136", notes: "", items: [["mochi", 1]] },
];

function priceOf(tiers: Tier[], tier: PlateTier) {
  return tiers.find((t) => t.id === tier)?.priceCents ?? 0;
}

function reference() {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `K-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")}`;
}

function defaults(): DemoState {
  const dishes: DemoDish[] = DEMO_DISHES.map((d) => ({
    id: d.id, name: d.name, nameJa: d.nameJa, description: d.description, category: d.category, tier: d.tier,
    portion: d.portion, allergens: d.allergens, tags: d.tags, available: true, visible: true, imagePath: d.image,
  }));
  const byId = new Map(dishes.map((d) => [d.id, d]));
  const now = Date.now();
  const orders: DemoOrder[] = SAMPLE_ORDERS.map((o, i) => {
    const items = o.items.map(([id, quantity]) => {
      const dish = byId.get(id)!;
      return { name: dish.name, quantity, lineTotalCents: priceOf(DEMO_TIERS, dish.tier) * quantity };
    });
    return {
      id: `demo-${i + 1}`, reference: reference(), status: o.status, customerName: o.name, customerPhone: o.phone, notes: o.notes,
      totalCents: items.reduce((sum, item) => sum + item.lineTotalCents, 0), createdAt: new Date(now - o.minutesAgo * 60_000).toISOString(), items,
    };
  });
  return { v: 1, tiers: DEMO_TIERS.map((t) => ({ ...t })), categories: DEMO_CATEGORIES.map((c) => ({ ...c })), dishes, settings: structuredClone(DEFAULT_SETTINGS), orders };
}

// --- External store ---------------------------------------------------------------------------

let state: DemoState | null = null;
const listeners = new Set<() => void>();

function read(): DemoState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as DemoState) : null;
    if (parsed?.v === 1 && Array.isArray(parsed.dishes) && Array.isArray(parsed.tiers) && parsed.tiers.length === 5 && parsed.settings) return parsed;
  } catch {
    // Unreadable or blocked storage: start from the sample data.
  }
  return defaults();
}

function commit(next: DemoState) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: the demo still works for this visit.
  }
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    state = read();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getSnapshot(): DemoState {
  if (!state) state = read();
  return state;
}

/** Server rendering and hydration see nothing; the demo data appears once the browser takes over. */
export function getServerSnapshot(): DemoState | null {
  return null;
}

function update(change: (draft: DemoState) => ActionResult | void): ActionResult {
  const draft = structuredClone(getSnapshot());
  const result = change(draft);
  if (result && !result.ok) return result;
  commit(draft);
  return { ok: true };
}

const fail = (error: string): ActionResult => ({ ok: false, error });

// --- Derived views ----------------------------------------------------------------------------

/** What the storefront shows: visible dishes, priced by their plate. */
export function storefrontDishes(s: DemoState): Dish[] {
  return s.dishes
    .filter((d) => d.visible)
    .map((d) => ({ ...d, priceCents: priceOf(s.tiers, d.tier), image: dishImageUrl(d.imagePath) }));
}

export function adminDish(d: DemoDish) {
  return { ...d, imageUrl: dishImageUrl(d.imagePath) };
}

// --- Admin operations (same shapes as the real admin's server actions) -----------------------

export function reset() {
  commit(defaults());
}

export function setAcceptingOrders(accepting: boolean) {
  return update((s) => { s.settings.acceptingOrders = accepting; });
}

export function setOrderStatus(orderId: string, status: OrderStatus) {
  return update((s) => {
    const order = s.orders.find((o) => o.id === orderId);
    if (!order) return fail("That order no longer exists.");
    order.status = status;
  });
}

export function setDishFlags(dishId: string, flags: { available?: boolean; visible?: boolean }) {
  return update((s) => {
    const dish = s.dishes.find((d) => d.id === dishId);
    if (!dish) return fail("This dish no longer exists.");
    if (typeof flags.available === "boolean") dish.available = flags.available;
    if (typeof flags.visible === "boolean") dish.visible = flags.visible;
  });
}

function toDemoDish(input: ReturnType<typeof dishSchema.parse>): DemoDish {
  return { ...input, tier: input.tier as PlateTier };
}

export function createDish(input: DishInput) {
  const parsed = dishSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  return update((s) => {
    if (s.dishes.some((d) => d.id === parsed.data.id)) return fail("Another dish already uses this web name. Choose a different one.");
    if (!s.categories.some((c) => c.id === parsed.data.category)) return fail("Choose a category and plate colour that exist.");
    s.dishes.push(toDemoDish(parsed.data));
  });
}

export function updateDish(input: DishInput) {
  const parsed = dishSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  return update((s) => {
    const index = s.dishes.findIndex((d) => d.id === parsed.data.id);
    if (index < 0) return fail("This dish no longer exists.");
    s.dishes[index] = toDemoDish(parsed.data);
  });
}

export function deleteDish(dishId: string) {
  return update((s) => {
    if (!s.dishes.some((d) => d.id === dishId)) return fail("This dish no longer exists.");
    s.dishes = s.dishes.filter((d) => d.id !== dishId);
  });
}

export function saveTiers(input: TierInput[]) {
  const parsed = tiersSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  return update((s) => {
    s.tiers = parsed.data.map((t) => ({ id: t.id as PlateTier, name: t.name, color: t.color, priceCents: t.priceCents }));
  });
}

export function createCategory(input: CategoryInput) {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  return update((s) => {
    if (s.categories.some((c) => c.id === parsed.data.id)) return fail("A category with this name already exists.");
    s.categories.push(parsed.data);
  });
}

export function updateCategory(input: CategoryInput) {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  return update((s) => {
    const category = s.categories.find((c) => c.id === parsed.data.id);
    if (!category) return fail("This category no longer exists.");
    Object.assign(category, parsed.data);
  });
}

export function moveCategory(id: string, direction: -1 | 1) {
  return update((s) => {
    const index = s.categories.findIndex((c) => c.id === id);
    const other = index + direction;
    if (index < 0 || other < 0 || other >= s.categories.length) return;
    [s.categories[index], s.categories[other]] = [s.categories[other], s.categories[index]];
  });
}

export function deleteCategory(id: string) {
  return update((s) => {
    if (s.dishes.some((d) => d.category === id)) return fail("Move or remove this category's dishes first.");
    s.categories = s.categories.filter((c) => c.id !== id);
  });
}

export function saveSettings(input: SettingsInput) {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  return update((s) => { s.settings = parsed.data; });
}

/** The demo storefront's checkout: turn the cart into a sample order for the demo admin. No guest details involved. */
export function sendSampleOrder(lines: { dishId: string; quantity: number }[]) {
  let ref = "";
  const result = update((s) => {
    const items = lines.flatMap((line) => {
      const dish = s.dishes.find((d) => d.id === line.dishId && d.visible && d.available);
      return dish ? [{ name: dish.name, quantity: line.quantity, lineTotalCents: priceOf(s.tiers, dish.tier) * line.quantity }] : [];
    });
    if (items.length === 0) return fail("Your order has nothing that can be ordered.");
    ref = reference();
    s.orders.unshift({
      id: `demo-${Date.now()}`, reference: ref, status: "new", customerName: "Demo guest", customerPhone: "+1 (555) 010-0100", notes: "",
      totalCents: items.reduce((sum, item) => sum + item.lineTotalCents, 0), createdAt: new Date().toISOString(), items,
    });
  });
  return result.ok ? { ok: true as const, reference: ref } : result;
}
