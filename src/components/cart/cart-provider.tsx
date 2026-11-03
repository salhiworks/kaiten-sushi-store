"use client";

import * as React from "react";
import { toast } from "sonner";
import * as store from "@/lib/cart/store";
import type { Dish, RestaurantSettings } from "@/lib/menu";
import { formatPrice } from "@/lib/money";
import { useStoreMenu } from "@/components/store/store-menu";
import { orderingState, type OrderingState } from "@/lib/restaurant/hours";

export interface CartItem {
  dish: Dish;
  quantity: number;
  totalCents: number;
}

interface CartState {
  items: CartItem[];
  /** Number of plates, not lines. */
  count: number;
  /** Total of the plates that can be ordered right now. */
  subtotalCents: number;
  /** Lines whose dish is sold out; they block checkout until removed. */
  unavailable: CartItem[];
  quantityOf: (dishId: string) => number;
  open: boolean;
  restaurant: RestaurantSettings;
  /** Null until the client knows the current time, so server and first client render agree. */
  ordering: OrderingState | null;
  demo: boolean;
  /** False during server rendering and hydration, before the saved cart has been read. */
  ready: boolean;
}

interface CartActions {
  add: (dishId: string) => void;
  setQuantity: (dishId: string, quantity: number) => void;
  remove: (dishId: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
}

const StateContext = React.createContext<CartState | null>(null);
const ActionsContext = React.createContext<CartActions | null>(null);

const noopSubscribe = () => () => {};
const DEMO_ORDERING: OrderingState = { kind: "demo" };

/** Re-evaluates opening hours every 30 seconds on the client. */
function useOrderingState(restaurant: RestaurantSettings) {
  const subscribe = React.useCallback((notify: () => void) => {
    const timer = window.setInterval(notify, 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const minute = React.useSyncExternalStore(subscribe, () => Math.floor(Date.now() / 30_000), () => -1);
  return React.useMemo(() => (minute < 0 ? null : orderingState(restaurant)), [restaurant, minute]);
}

export function CartProvider({ demo, children }: { demo: boolean; children: React.ReactNode }) {
  const { dishes, restaurant } = useStoreMenu();
  const lines = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const [open, setOpen] = React.useState(false);
  const liveOrdering = useOrderingState(restaurant);
  const ordering: OrderingState | null = demo ? DEMO_ORDERING : liveOrdering;
  const ready = React.useSyncExternalStore(noopSubscribe, () => true, () => false);

  const byId = React.useMemo(() => new Map(dishes.map((dish) => [dish.id, dish])), [dishes]);

  const state = React.useMemo<CartState>(() => {
    const items: CartItem[] = [];
    for (const line of lines) {
      // Lines for dishes that left the menu are ignored rather than shown without a price.
      const dish = byId.get(line.dishId);
      if (dish) items.push({ dish, quantity: line.quantity, totalCents: dish.priceCents * line.quantity });
    }
    const quantities = new Map(items.map((item) => [item.dish.id, item.quantity]));
    return {
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotalCents: items.reduce((sum, item) => sum + (item.dish.available ? item.totalCents : 0), 0),
      unavailable: items.filter((item) => !item.dish.available),
      quantityOf: (dishId) => quantities.get(dishId) ?? 0,
      open,
      restaurant,
      ordering,
      demo,
      ready,
    };
  }, [lines, byId, open, restaurant, ordering, demo, ready]);

  const actions = React.useMemo<CartActions>(() => ({
    add(dishId) {
      const dish = byId.get(dishId);
      if (!dish) return;
      if (!dish.available) {
        toast(`${dish.name} is sold out right now.`);
        return;
      }
      const current = store.getSnapshot().find((line) => line.dishId === dishId)?.quantity ?? 0;
      if (current >= store.MAX_QUANTITY) {
        toast(`Up to ${store.MAX_QUANTITY} plates of ${dish.name} per order.`);
        return;
      }
      store.addLine(dishId);
      toast.success(`${dish.name} added to your order`, {
        id: "cart-add",
        description: `${formatPrice(dish.priceCents)} · ${current + 1} in order`,
        action: { label: "View order", onClick: () => setOpen(true) },
      });
    },
    setQuantity: store.setLineQuantity,
    remove: store.removeLine,
    clear: store.clearLines,
    setOpen(next) {
      // The drawer shows the same information as the "added" toast, and the toast would cover its footer.
      if (next) toast.dismiss("cart-add");
      setOpen(next);
    },
  }), [byId]);

  return (
    <ActionsContext.Provider value={actions}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </ActionsContext.Provider>
  );
}

export function useCart() {
  const state = React.useContext(StateContext);
  if (!state) throw new Error("useCart must be used inside <CartProvider>");
  return state;
}

/** Stable cart actions; components that only add to the cart don't re-render when it changes. */
export function useCartActions() {
  const actions = React.useContext(ActionsContext);
  if (!actions) throw new Error("useCartActions must be used inside <CartProvider>");
  return actions;
}
