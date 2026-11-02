import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { DishForm } from "@/components/admin/dish-form";
import { getAdminSession, getMenuForAdmin } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Add dish" };

export default function NewDishPage() {
  return (
    <>
      <AdminPageHeader title="Add a dish" description="New dishes appear on the belt and the menu as soon as you save, unless you switch off “On menu”." />
      <Suspense fallback={<div aria-busy="true" className="h-96" />}>
        <Editor />
      </Suspense>
    </>
  );
}

async function Editor() {
  const session = await getAdminSession();
  if (session.status !== "admin") return null;
  const { categories, tiers } = await getMenuForAdmin(session.db);
  return <DishForm dish={null} categories={categories} tiers={tiers} />;
}
