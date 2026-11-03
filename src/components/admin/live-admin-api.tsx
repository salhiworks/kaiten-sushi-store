"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  createCategory,
  createDish,
  deleteCategory,
  deleteDish,
  discardUpload,
  moveCategory,
  saveSettings,
  saveTiers,
  setAcceptingOrders,
  setDishFlags,
  setOrderStatus,
  updateCategory,
  updateDish,
} from "@/lib/admin/actions";
import { DISH_IMAGE_BUCKET } from "@/lib/menu/images";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { AdminApiProvider, type AdminApi } from "./admin-api";

/** The real admin: every operation is a server action that re-checks admin access and runs under RLS. */
export function LiveAdminApi({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const api = React.useMemo<AdminApi>(() => ({
    base: "/admin",
    demo: false,
    setAcceptingOrders: setAcceptingOrders,
    setOrderStatus: setOrderStatus,
    setDishFlags: setDishFlags,
    createDish: createDish,
    updateDish: updateDish,
    deleteDish: deleteDish,
    saveTiers: saveTiers,
    createCategory: createCategory,
    updateCategory: updateCategory,
    moveCategory: moveCategory,
    deleteCategory: deleteCategory,
    saveSettings: saveSettings,
    discardUpload: discardUpload,
    async uploadPhoto(path, file) {
      const { error } = await createBrowserSupabase().storage.from(DISH_IMAGE_BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000" });
      return { error: error?.message };
    },
    refresh: () => router.refresh(),
  }), [router]);
  return <AdminApiProvider api={api}>{children}</AdminApiProvider>;
}
