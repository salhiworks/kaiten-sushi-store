import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { TiersForm } from "@/components/admin/tiers-form";
import { getAdminSession, getMenuForAdmin } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Plates & prices" };

export default function PlatesPage() {
  return (
    <>
      <AdminPageHeader
        title="Plates & prices"
        description="On a kaiten belt the plate colour is the price. Each dish sits on one of these five plates, so changing a price here updates every dish on that plate, the belt's colour key, the menu and guests' carts at once."
      />
      <Suspense fallback={<div aria-busy="true" className="h-96" />}>
        <Tiers />
      </Suspense>
    </>
  );
}

async function Tiers() {
  const session = await getAdminSession();
  if (session.status !== "admin") return null;
  const { tiers, dishes } = await getMenuForAdmin(session.db);
  const dishesByTier = Object.fromEntries(tiers.map((tier) => [tier.id, dishes.filter((dish) => dish.tier === tier.id).map((dish) => dish.name)]));
  return <TiersForm tiers={tiers} dishesByTier={dishesByTier} />;
}
