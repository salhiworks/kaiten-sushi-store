"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useCart, useCartActions } from "./cart-provider";
import { OrderingNotice } from "./ordering-notice";
import { PlateStack, useOrderPlates } from "./plate-stack";
import { QuantityStepper } from "./quantity-stepper";

/** The guest's order: a side drawer on larger screens, a bottom sheet on phones. */
export function CartDrawer() {
  const { items, count, subtotalCents, unavailable, open, ordering, demo } = useCart();
  const { setOpen, setQuantity, remove, clear } = useCartActions();
  const plates = useOrderPlates();
  const canCheckout = !demo && items.length > 0 && unavailable.length === 0 && ordering?.kind !== "paused" && ordering?.kind !== "closed";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        data-cart-drawer
        showCloseButton={false}
        className={cn(
          "gap-0 bg-background p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[28rem]",
          // Phones: a bottom sheet within thumb reach.
          "max-sm:data-[side=right]:inset-x-0 max-sm:data-[side=right]:top-auto max-sm:data-[side=right]:bottom-0 max-sm:data-[side=right]:h-[90svh] max-sm:data-[side=right]:rounded-t-[1.75rem] max-sm:data-[side=right]:border-l-0",
          "max-sm:data-[side=right]:data-open:slide-in-from-right-0 max-sm:data-open:slide-in-from-bottom-16 max-sm:data-[side=right]:data-closed:slide-out-to-right-0 max-sm:data-closed:slide-out-to-bottom-16",
        )}
      >
        <SheetHeader className="dark relative flex-row items-end gap-5 rounded-t-[1.75rem] bg-ai-950 px-6 pb-6 pt-7 text-foreground sm:rounded-none">
          <span aria-hidden="true" className="absolute left-1/2 top-2.5 h-1 w-10 -translate-x-1/2 rounded-full bg-white/20 sm:hidden" />
          <PlateStack tiers={plates} width={58} max={10} className="shrink-0 text-foreground/60" />
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-2xl font-bold text-foreground">Your order</SheetTitle>
            <SheetDescription className="text-muted-foreground">
              {count ? `${count} ${count === 1 ? "plate" : "plates"} for pickup · ${formatPrice(subtotalCents)}` : "No plates yet"}
            </SheetDescription>
          </div>
          <SheetClose className="grid size-9 shrink-0 place-items-center self-start rounded-full text-muted-foreground outline-none hover:bg-white/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close order">
            <X aria-hidden="true" className="size-4" />
          </SheetClose>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <PlateStack tiers={[]} width={110} className="text-muted-foreground" />
            <div className="space-y-1.5">
              <p className="font-display text-xl font-bold">Your stack is empty</p>
              <p className="text-sm text-muted-foreground">Lift a plate from the belt or browse the menu, and your plates stack up here.</p>
            </div>
            <Link href="/menu" onClick={() => setOpen(false)} className={buttonVariants({ size: "lg" })}>
              Explore the menu
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border overflow-y-auto px-6" aria-label="Dishes in your order">
              {items.map(({ dish, quantity, totalCents }) => (
                <li key={dish.id} data-cart-line={dish.id} data-sold-out={!dish.available || undefined} className="flex gap-4 py-5">
                  <div className={cn("relative size-16 shrink-0", !dish.available && "opacity-50 grayscale")}>
                    <Image src={dish.image} alt="" fill sizes="64px" className="object-contain" />
                    <span aria-hidden="true" className="absolute -inset-[2%] rounded-full border-2" style={{ borderColor: `var(--chart-${dish.tier})` }} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{dish.name}</p>
                        {dish.available ? (
                          <p className="text-xs tabular-nums text-muted-foreground">{formatPrice(dish.priceCents)} each</p>
                        ) : (
                          <p className="text-xs font-medium text-destructive">Sold out — remove to continue</p>
                        )}
                      </div>
                      <p data-line-total className={cn("text-sm font-medium tabular-nums", !dish.available && "text-muted-foreground line-through")}>
                        {formatPrice(totalCents)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      {dish.available ? (
                        <QuantityStepper name={dish.name} quantity={quantity} onChange={(next) => setQuantity(dish.id, next)} className="h-8 [&_button]:size-8" />
                      ) : (
                        <span />
                      )}
                      <Button variant="ghost" size="sm" onClick={() => remove(dish.id)} aria-label={`Remove ${dish.name} from order`} className="text-muted-foreground">
                        Remove
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <SheetFooter className="gap-4 border-t border-border bg-card px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
              <OrderingNotice className="bg-background" />
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span data-subtotal className="font-display text-2xl font-bold tabular-nums">{formatPrice(subtotalCents)}</span>
              </div>
              <div className="space-y-2">
                {canCheckout ? (
                  <Link href="/checkout" onClick={() => setOpen(false)} data-checkout className={buttonVariants({ size: "lg", className: "h-12 w-full text-base" })}>
                    Checkout for pickup
                    <ArrowRight aria-hidden="true" data-icon="inline-end" />
                  </Link>
                ) : (
                  <Button size="lg" className="h-12 w-full text-base" disabled data-checkout aria-describedby="checkout-note">
                    {demo ? "Ordering is off in this demo" : "Checkout for pickup"}
                  </Button>
                )}
                <p id="checkout-note" className="text-center text-xs leading-relaxed text-muted-foreground">
                  {unavailable.length > 0
                    ? "Remove sold-out plates to continue."
                    : demo
                      ? "This is a demo store: your plates stay here, but no orders can be placed."
                      : "Pay when you collect. No account needed."}
                </p>
              </div>
              <button type="button" onClick={clear} className="mx-auto text-xs text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:underline">
                Clear order
              </button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
