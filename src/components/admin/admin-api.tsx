"use client";

import * as React from "react";
import type { ActionResult, CategoryInput, DishInput, OrderStatus, SettingsInput, TierInput } from "@/lib/admin/schemas";

/**
 * Everything the admin screens can do. The real admin provides protected server actions
 * (live-admin-api.tsx); the public demo provides browser-only versions (components/demo).
 * The screens themselves don't know which one they are using.
 */
export interface AdminApi {
  /** Where the admin lives: "/admin", or "/demo/admin" for the demo. */
  base: string;
  demo: boolean;
  setAcceptingOrders: (accepting: boolean) => Promise<ActionResult>;
  setOrderStatus: (orderId: string, status: OrderStatus) => Promise<ActionResult>;
  setDishFlags: (dishId: string, flags: { available?: boolean; visible?: boolean }) => Promise<ActionResult>;
  createDish: (input: DishInput) => Promise<ActionResult>;
  updateDish: (input: DishInput) => Promise<ActionResult>;
  deleteDish: (dishId: string) => Promise<ActionResult>;
  saveTiers: (input: TierInput[]) => Promise<ActionResult>;
  createCategory: (input: CategoryInput) => Promise<ActionResult>;
  updateCategory: (input: CategoryInput) => Promise<ActionResult>;
  moveCategory: (id: string, direction: -1 | 1) => Promise<ActionResult>;
  deleteCategory: (id: string) => Promise<ActionResult>;
  saveSettings: (input: SettingsInput) => Promise<ActionResult>;
  /** Uploads a dish photo and returns its storage path. Absent in the demo. */
  uploadPhoto?: (path: string, file: File) => Promise<{ error?: string }>;
  discardUpload?: (path: string) => Promise<ActionResult>;
  /** Pulls fresh data from the server. Absent in the demo, where data is already local. */
  refresh?: () => void;
}

const AdminApiContext = React.createContext<AdminApi | null>(null);

export function AdminApiProvider({ api, children }: { api: AdminApi; children: React.ReactNode }) {
  return <AdminApiContext.Provider value={api}>{children}</AdminApiContext.Provider>;
}

export function useAdminApi() {
  const api = React.useContext(AdminApiContext);
  if (!api) throw new Error("useAdminApi must be used inside <AdminApiProvider>");
  return api;
}
