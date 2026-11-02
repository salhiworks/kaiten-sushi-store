"use client";

import { cn } from "@/lib/utils";
import { useCart, useCartActions } from "./cart-provider";
import { PlateStack, useOrderPlates } from "./plate-stack";

/** Header order button: a small stack of the guest's plates and the count. */
export function CartButton({ className }: { className?: string }) {
  const { count } = useCart();
  const { setOpen } = useCartActions();
  const plates = useOrderPlates();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={count ? `Your order, ${count} ${count === 1 ? "plate" : "plates"}` : "Your order, empty"}
      data-cart-button
      className={cn(
        "group inline-flex h-10 items-center gap-2.5 rounded-full border border-foreground/15 bg-foreground/[0.04] pl-3 pr-3.5 text-sm font-medium outline-none transition-colors hover:border-foreground/30 hover:bg-foreground/[0.08] focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <PlateStack tiers={plates} width={26} max={4} showOverflow={false} className="text-foreground" />
      <span>Order</span>
      {count > 0 && (
        <span key={count} data-cart-count className="grid h-5 min-w-5 place-items-center rounded-full bg-hinoki px-1.5 text-[11px] font-bold tabular-nums text-ai-950 animate-in zoom-in-50 duration-300 motion-reduce:animate-none">
          {count}
        </span>
      )}
    </button>
  );
}

/** Opens the order drawer from anywhere on the page. */
export function OpenCartButton({ className, children }: { className?: string; children: React.ReactNode }) {
  const { setOpen } = useCartActions();
  return (
    <button type="button" onClick={() => setOpen(true)} className={className}>
      {children}
    </button>
  );
}
