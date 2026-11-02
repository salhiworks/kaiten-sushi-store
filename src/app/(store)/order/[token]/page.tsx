import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OrderConfirmationView } from "@/components/orders/order-confirmation";
import { getRestaurant } from "@/lib/menu/server";
import { getOrderByToken } from "@/lib/orders/server";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
  // The URL is the guest's key to their order; never pass it on to other sites.
  referrer: "no-referrer",
};

export default function OrderPage({ params }: PageProps<"/order/[token]">) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      <Order params={params} />
    </Suspense>
  );
}

async function Order({ params }: Pick<PageProps<"/order/[token]">, "params">) {
  const { token } = await params;
  const [order, restaurant] = await Promise.all([getOrderByToken(token), getRestaurant()]);
  if (!order) notFound();
  return <OrderConfirmationView order={order} restaurant={restaurant} />;
}
