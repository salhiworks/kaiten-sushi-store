import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { getAdminSession, getMenuForAdmin } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <>
      <AdminPageHeader title="Categories" description="The sections of the menu page and its filters, in the order guests see them." />
      <Suspense fallback={<div aria-busy="true" className="h-96" />}>
        <Categories />
      </Suspense>
    </>
  );
}

async function Categories() {
  const session = await getAdminSession();
  if (session.status !== "admin") return null;
  const { categories, dishes } = await getMenuForAdmin(session.db);
  const counts = Object.fromEntries(categories.map((c) => [c.id, dishes.filter((d) => d.category === c.id).length]));
  return <CategoriesManager categories={categories} counts={counts} />;
}
