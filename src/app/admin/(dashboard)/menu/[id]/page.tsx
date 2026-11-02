import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { DishForm } from "@/components/admin/dish-form";
import { getAdminSession, getDishForAdmin, getMenuForAdmin } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Edit dish" };

export default function EditDishPage({ params }: PageProps<"/admin/menu/[id]">) {
  return (
    <Suspense fallback={<div aria-busy="true" className="h-96" />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: Pick<PageProps<"/admin/menu/[id]">, "params">) {
  const { id } = await params;
  const session = await getAdminSession();
  if (session.status !== "admin") return null;
  const [dish, { categories, tiers }] = await Promise.all([getDishForAdmin(session.db, id), getMenuForAdmin(session.db)]);
  if (!dish) notFound();
  return (
    <>
      <AdminPageHeader title={dish.name} description="Changes show on the belt, the menu and in guests' carts as soon as you save." />
      <DishForm dish={dish} categories={categories} tiers={tiers} />
    </>
  );
}
