"use client";

import { Clock, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "./cart-provider";

/** Explains why ordering is unavailable right now, or renders nothing while it is open. */
export function OrderingNotice({ className }: { className?: string }) {
  const { ordering, restaurant } = useCart();
  // The demo explains itself next to the checkout button instead.
  if (!ordering || ordering.kind === "open" || ordering.kind === "demo") return null;
  const paused = ordering.kind === "paused";
  return (
    <div role="status" data-ordering-notice={ordering.kind} className={cn("flex gap-3 rounded-xl border border-border bg-card p-4 text-sm", className)}>
      {paused ? <PauseCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-vermilion" /> : <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-vermilion" />}
      <div className="space-y-1">
        <p className="font-medium">{paused ? `${restaurant.name} has paused online orders` : `${restaurant.name} is closed right now`}</p>
        <p className="text-muted-foreground">
          {paused
            ? ordering.message || "Please check back a little later. Your order stays saved here."
            : ordering.opensAt
              ? `Ordering opens ${ordering.opensDay} at ${ordering.opensAt}. Your order stays saved here.`
              : "Online ordering is not scheduled at the moment."}
        </p>
      </div>
    </div>
  );
}
