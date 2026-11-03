"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AdminApiProvider, type AdminApi } from "@/components/admin/admin-api";
import { AdminPageHeader, AdminShell, AdminShellFallback } from "@/components/admin/admin-shell";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { DishForm } from "@/components/admin/dish-form";
import { DishList } from "@/components/admin/dish-list";
import { OrdersBoard } from "@/components/admin/orders-board";
import { SettingsForm } from "@/components/admin/settings-form";
import { TiersForm } from "@/components/admin/tiers-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import * as store from "@/lib/demo/store";

/** The demo admin's data, read from this browser. Null during server rendering and hydration. */
export function useDemoState() {
  return React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

const DEMO_BASE = "/demo/admin";
const VIEWS = {
  active: ["new", "preparing", "ready"],
  collected: ["collected"],
  cancelled: ["cancelled"],
} as const;

/** The same admin screens as the real dashboard, wired to the browser-only demo store. */
export function DemoAdminApi({ children }: { children: React.ReactNode }) {
  const api = React.useMemo<AdminApi>(() => ({
    base: DEMO_BASE,
    demo: true,
    setAcceptingOrders: async (accepting) => store.setAcceptingOrders(accepting),
    setOrderStatus: async (id, status) => store.setOrderStatus(id, status),
    setDishFlags: async (id, flags) => store.setDishFlags(id, flags),
    createDish: async (input) => store.createDish(input),
    updateDish: async (input) => store.updateDish(input),
    deleteDish: async (id) => store.deleteDish(id),
    saveTiers: async (input) => store.saveTiers(input),
    createCategory: async (input) => store.createCategory(input),
    updateCategory: async (input) => store.updateCategory(input),
    moveCategory: async (id, direction) => store.moveCategory(id, direction),
    deleteCategory: async (id) => store.deleteCategory(id),
    saveSettings: async (input) => store.saveSettings(input),
  }), []);
  return <AdminApiProvider api={api}>{children}</AdminApiProvider>;
}

function DemoBanner() {
  return (
    <div data-demo-admin-banner className="bg-hinoki text-ai-950">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 text-sm sm:px-6">
        <p className="min-w-0 flex-1">
          <span className="font-bold">Demo admin.</span> A sample restaurant with sample orders. Changes stay in this browser, and the demo store follows them.
        </p>
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-full px-3 py-1.5 text-sm font-medium underline-offset-4 hover:underline">Back to the store</Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" data-reset-demo className="inline-flex items-center gap-1.5 rounded-full bg-ai-950 px-3.5 py-1.5 text-sm font-medium text-kinari outline-none focus-visible:ring-2 focus-visible:ring-ai-700">
                <RotateCcw aria-hidden="true" className="size-3.5" />
                Reset demo
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset the demo?</AlertDialogTitle>
                <AlertDialogDescription>This puts the sample menu, prices, orders and settings back the way they started. Your order in the store is kept.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep my changes</AlertDialogCancel>
                <AlertDialogAction data-confirm-reset onClick={() => { store.reset(); toast.success("Demo reset to the sample restaurant."); }}>Reset demo</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

export function DemoAdminShell({ children }: { children: React.ReactNode }) {
  const state = useDemoState();
  if (!state) return <AdminShellFallback />;
  return (
    <AdminShell restaurantName={state.settings.name} acceptingOrders={state.settings.acceptingOrders} email="" banner={<DemoBanner />}>
      {children}
    </AdminShell>
  );
}

const Pending = () => <div aria-busy="true" className="h-64 rounded-2xl border border-dashed border-border" />;

export function DemoOrdersPage() {
  return (
    <>
      <AdminPageHeader title="Orders" description="Pickup orders, oldest first. Move each one along as the kitchen works on it. These are sample orders; try sending your own from the demo store's checkout." />
      <React.Suspense fallback={<Pending />}>
        <DemoOrders />
      </React.Suspense>
    </>
  );
}

function DemoOrders() {
  const state = useDemoState();
  const param = useSearchParams().get("view");
  const view = param && param in VIEWS ? (param as keyof typeof VIEWS) : "active";
  if (!state) return <Pending />;
  const inView = (key: keyof typeof VIEWS) => state.orders.filter((o) => (VIEWS[key] as readonly string[]).includes(o.status));
  const orders = [...inView(view)].sort((a, b) => (view === "active" ? 1 : -1) * (Date.parse(a.createdAt) - Date.parse(b.createdAt)));
  const counts = { active: inView("active").length, collected: inView("collected").length, cancelled: inView("cancelled").length };
  return <OrdersBoard view={view} orders={orders} counts={counts} />;
}

export function DemoMenuPage() {
  const state = useDemoState();
  return (
    <>
      <AdminPageHeader
        title="Menu"
        description="Everything guests can order. Mark a dish sold out or hide it, then look at the demo store: the belt and menu follow."
        actions={
          <Link href={`${DEMO_BASE}/menu/new`} className={buttonVariants({ size: "lg" })}>
            <Plus aria-hidden="true" data-icon="inline-start" />
            Add dish
          </Link>
        }
      />
      {state ? <DishList dishes={state.dishes.map(store.adminDish)} categories={state.categories} tiers={state.tiers} /> : <Pending />}
    </>
  );
}

export function DemoNewDishPage() {
  const state = useDemoState();
  return (
    <>
      <AdminPageHeader title="Add a dish" description="New dishes appear on the demo belt and menu as soon as you save." />
      {state ? <DishForm dish={null} categories={state.categories} tiers={state.tiers} /> : <Pending />}
    </>
  );
}

export function DemoEditDishPage() {
  return (
    <React.Suspense fallback={<Pending />}>
      <DemoEditDish />
    </React.Suspense>
  );
}

function DemoEditDish() {
  const state = useDemoState();
  const { id } = useParams<{ id: string }>();
  if (!state) return <Pending />;
  const dish = state.dishes.find((d) => d.id === id);
  if (!dish) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
        <p className="font-display text-xl">This dish isn&apos;t in the demo menu</p>
        <Link href={`${DEMO_BASE}/menu`} className={buttonVariants({ size: "lg", className: "mt-6" })}>Back to the menu</Link>
      </div>
    );
  }
  return (
    <>
      <AdminPageHeader title={dish.name} description="Changes show on the demo belt, menu and order as soon as you save." />
      <DishForm key={dish.id} dish={store.adminDish(dish)} categories={state.categories} tiers={state.tiers} />
    </>
  );
}

export function DemoPlatesPage() {
  const state = useDemoState();
  return (
    <>
      <AdminPageHeader
        title="Plates & prices"
        description="On a kaiten belt the plate colour is the price. Change a price here and every dish on that plate, the belt's colour key and the demo order all follow."
      />
      {state ? (
        <TiersForm
          key={state.tiers.map((t) => `${t.id}${t.priceCents}${t.color}${t.name}`).join()}
          tiers={state.tiers}
          dishesByTier={Object.fromEntries(state.tiers.map((t) => [t.id, state.dishes.filter((d) => d.tier === t.id).map((d) => d.name)]))}
        />
      ) : <Pending />}
    </>
  );
}

export function DemoCategoriesPage() {
  const state = useDemoState();
  return (
    <>
      <AdminPageHeader title="Categories" description="The sections of the menu page and its filters, in the order guests see them." />
      {state ? (
        <CategoriesManager
          key={state.categories.map((c) => c.id).join()}
          categories={state.categories}
          counts={Object.fromEntries(state.categories.map((c) => [c.id, state.dishes.filter((d) => d.category === c.id).length]))}
        />
      ) : <Pending />}
    </>
  );
}

export function DemoSettingsPage() {
  const state = useDemoState();
  return (
    <>
      <AdminPageHeader title="Restaurant" description="Your name, pickup details and opening hours. In a real store, guests can only order while you are open and taking orders." />
      {state ? <SettingsForm key={JSON.stringify(state.settings)} settings={state.settings} /> : <Pending />}
    </>
  );
}
