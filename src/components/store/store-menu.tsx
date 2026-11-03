"use client";

import * as React from "react";
import * as demoStore from "@/lib/demo/store";
import type { Dish, MenuCategory, RestaurantSettings, Tier } from "@/lib/menu";

export interface StoreMenu {
  dishes: Dish[];
  categories: MenuCategory[];
  tiers: Tier[];
  restaurant: RestaurantSettings;
}

const StoreMenuContext = React.createContext<StoreMenu | null>(null);
const noop = () => () => {};
const none = () => null;

/**
 * The menu and restaurant details every storefront component reads.
 *
 * Live stores: exactly what the server rendered from Supabase.
 * Demo builds: the demo admin's browser-only data (lib/demo/store.ts) once the page is running in the
 * browser, so a price or stock change made at /demo/admin shows on the belt, the menu and the order.
 */
export function StoreMenuProvider({ menu, demo, children }: { menu: StoreMenu; demo: boolean; children: React.ReactNode }) {
  const demoState = React.useSyncExternalStore(demo ? demoStore.subscribe : noop, demo ? demoStore.getSnapshot : none, none);
  const value = React.useMemo<StoreMenu>(() => {
    if (!demoState) return menu;
    return { dishes: demoStore.storefrontDishes(demoState), categories: demoState.categories, tiers: demoState.tiers, restaurant: demoState.settings };
  }, [demoState, menu]);
  return (
    <StoreMenuContext.Provider value={value}>
      {/* Demo plate colours follow the demo admin; later in the document than the server's, so they win. */}
      {demoState && <style>{`:root{${demoState.tiers.filter((t) => /^#[0-9a-f]{6}$/i.test(t.color)).map((t) => `--chart-${t.id}:${t.color};`).join("")}}`}</style>}
      {children}
    </StoreMenuContext.Provider>
  );
}

export function useStoreMenu() {
  const value = React.useContext(StoreMenuContext);
  if (!value) throw new Error("useStoreMenu must be used inside <StoreMenuProvider>");
  return value;
}
