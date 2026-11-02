import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { OrdersBoard } from "@/components/admin/orders-board";
import { getAdminSession, getOrdersForAdmin, ORDER_VIEWS, type OrderView } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage({ searchParams }: PageProps<"/admin">) {
  return (
    <>
      <AdminPageHeader title="Orders" description="Pickup orders, oldest first. Move each one along as the kitchen works on it. This page checks for new orders every 20 seconds." />
      <Suspense fallback={<div aria-busy="true" className="h-64 rounded-2xl border border-dashed border-border" />}>
        <Orders searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Orders({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  const params = await searchParams;
  const view: OrderView = typeof params.view === "string" && params.view in ORDER_VIEWS ? (params.view as OrderView) : "active";
  const session = await getAdminSession();
  if (session.status !== "admin") return null;
  const { orders, counts } = await getOrdersForAdmin(session.db, view);
  return <OrdersBoard view={view} orders={orders} counts={counts} />;
}
