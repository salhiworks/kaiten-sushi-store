"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, RefreshCw } from "lucide-react";
import { Seal } from "@/components/site/brand-mark";
import { Button, buttonVariants } from "@/components/ui/button";
import type { RestaurantSettings } from "@/lib/menu";
import { formatPrice } from "@/lib/money";
import type { OrderConfirmation } from "@/lib/orders/checkout";
import { cn } from "@/lib/utils";

const STEPS = [
  { status: "new", label: "Received" },
  { status: "preparing", label: "Preparing" },
  { status: "ready", label: "Ready for pickup" },
  { status: "collected", label: "Collected" },
] as const;

const HEADLINES: Record<OrderConfirmation["status"], string> = {
  new: "Your order is in.",
  preparing: "Your order is being prepared.",
  ready: "Your order is ready to collect.",
  collected: "Enjoy your meal.",
  cancelled: "This order was cancelled.",
};

export function OrderConfirmationView({ order, restaurant }: { order: OrderConfirmation; restaurant: RestaurantSettings }) {
  const router = useRouter();
  const [refreshing, startRefresh] = React.useTransition();
  const final = order.status === "collected" || order.status === "cancelled";
  const stepIndex = STEPS.findIndex((step) => step.status === order.status);
  const readyBy = new Date(new Date(order.createdAt).getTime() + restaurant.prepMinutes * 60_000);

  // Keep the status current while the guest waits.
  React.useEffect(() => {
    if (final) return;
    const timer = window.setInterval(() => startRefresh(() => router.refresh()), 30_000);
    return () => window.clearInterval(timer);
  }, [final, router]);

  const readyTime = readyBy.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: restaurant.timezone });

  return (
    <div data-order-confirmation={order.reference} className="mx-auto max-w-2xl px-4 pb-24 pt-10 sm:px-6 sm:pt-16">

      <p className="text-sm text-muted-foreground">Thank you, {order.customerName}.</p>
      <h1 className="mt-2 text-balance text-[clamp(2.25rem,6vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.02em]">{HEADLINES[order.status]}</h1>

      {/* The pickup ticket */}
      <article aria-label="Pickup ticket" className="mt-8 overflow-hidden rounded-[1.75rem] bg-card shadow-[0_30px_60px_-36px_rgba(15,22,40,0.55)] ring-1 ring-border">
        <div className="dark flex items-center justify-between gap-6 bg-ai-950 px-6 py-6 text-foreground sm:px-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Order reference</p>
            <p data-reference className="mt-1 font-mono text-3xl font-medium tracking-[0.14em] sm:text-4xl">{order.reference}</p>
          </div>
          <Seal className="size-11 shrink-0" />
        </div>

        <div className="px-6 py-6 sm:px-8">
          {order.status === "cancelled" ? (
            <p className="rounded-xl bg-background p-4 text-sm text-muted-foreground">
              The restaurant cancelled this order. {restaurant.phone ? `Please call ${restaurant.phone} if you have questions.` : "Please contact the restaurant if you have questions."}
            </p>
          ) : (
            <ol aria-label="Order progress" className="grid grid-cols-4 gap-2">
              {STEPS.map((step, index) => {
                const done = index <= stepIndex;
                return (
                  <li key={step.status} aria-current={index === stepIndex ? "step" : undefined} className="flex flex-col gap-2.5">
                    <span className={cn("h-1.5 rounded-full transition-colors", done ? "bg-ai-900" : "bg-border", index === stepIndex && !final && "animate-pulse motion-reduce:animate-none")} />
                    <span className={cn("flex items-center gap-1.5 text-xs sm:text-sm", done ? "font-medium text-foreground" : "text-muted-foreground")}>
                      {done && <Check aria-hidden="true" className="size-3.5 shrink-0" />}
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
          {!final && (
            <p className="mt-5 text-sm">
              Ready in about <span className="font-bold">{restaurant.prepMinutes} minutes</span>
              <span className="text-muted-foreground"> · around {readyTime}</span>
            </p>
          )}
        </div>

        {/* Perforation */}
        <div aria-hidden="true" className="relative h-6">
          <span className="absolute -left-3 top-0 size-6 rounded-full bg-background ring-1 ring-border" />
          <span className="absolute -right-3 top-0 size-6 rounded-full bg-background ring-1 ring-border" />
          <span className="absolute inset-x-6 top-1/2 border-t-2 border-dashed border-border" />
        </div>

        <div className="grid gap-8 px-6 pb-7 pt-4 sm:grid-cols-[1.3fr_1fr] sm:px-8">
          <section aria-labelledby="order-items-title">
            <h2 id="order-items-title" className="text-lg font-bold">Your plates</h2>
            <ul className="mt-2 divide-y divide-border">
              {order.items.map((item, index) => (
                <li key={index} className="flex items-baseline gap-3 py-3 text-sm">
                  <span className="tabular-nums text-muted-foreground">{item.quantity} ×</span>
                  <span className="flex-1">{item.name}</span>
                  <span className="tabular-nums">{formatPrice(item.lineTotalCents)}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between border-t-2 border-foreground/80 pt-3">
              <span className="text-sm">Total, paid at pickup</span>
              <span data-order-total className="font-display text-2xl font-bold tabular-nums">{formatPrice(order.totalCents)}</span>
            </div>
            {order.notes && (
              <p className="mt-4 rounded-xl bg-background p-3.5 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Your note: </span>
                {order.notes}
              </p>
            )}
          </section>

          <section aria-labelledby="pickup-title" className="space-y-3 text-sm">
            <h2 id="pickup-title" className="text-lg font-bold">Pickup</h2>
            <div className="space-y-1 text-muted-foreground">
              <p className="font-medium text-foreground">{restaurant.name}</p>
              {restaurant.pickupAddress && <p className="whitespace-pre-line">{restaurant.pickupAddress}</p>}
              {restaurant.pickupNotes && <p className="whitespace-pre-line">{restaurant.pickupNotes}</p>}
              {restaurant.phone && (
                <p>
                  <a href={`tel:${restaurant.phone.replace(/[^\d+]/g, "")}`} className="underline-offset-4 hover:underline">{restaurant.phone}</a>
                </p>
              )}
            </div>
            <p className="text-muted-foreground">Pay when you collect. Show this reference at the counter.</p>
          </section>
        </div>
      </article>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href="/menu" className={buttonVariants({ size: "lg" })}>Back to the menu</Link>
        {!final && (
          <Button variant="outline" size="lg" className="bg-card" disabled={refreshing} onClick={() => startRefresh(() => router.refresh())}>
            <RefreshCw aria-hidden="true" className={cn(refreshing && "animate-spin motion-reduce:animate-none")} />
            Refresh status
          </Button>
        )}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Keep this page to check on your order. Anyone with the link can see it.</p>
    </div>
  );
}
