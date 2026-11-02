import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { DishList } from "@/components/admin/dish-list";
import { buttonVariants } from "@/components/ui/button";
import { getAdminSession, getMenuForAdmin } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Menu" };

export default function AdminMenuPage() {
  return (
    <>
      <AdminPageHeader
        title="Menu"
        description="Everything guests can order. Mark a dish sold out when it runs out today, or hide it to take it off the menu without deleting it."
        actions={
          <Link href="/admin/menu/new" className={buttonVariants({ size: "lg" })}>
            <Plus aria-hidden="true" data-icon="inline-start" />
            Add dish
          </Link>
        }
      />
      <Suspense fallback={<div aria-busy="true" className="h-96 rounded-2xl border border-dashed border-border" />}>
        <Dishes />
      </Suspense>
    </>
  );
}

async function Dishes() {
  const session = await getAdminSession();
  if (session.status !== "admin") return null;
  const menu = await getMenuForAdmin(session.db);
  return <DishList {...menu} />;
}
