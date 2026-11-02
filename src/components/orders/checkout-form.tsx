"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCart, useCartActions } from "@/components/cart/cart-provider";
import { OrderingNotice } from "@/components/cart/ordering-notice";
import { PlateStack, useOrderPlates } from "@/components/cart/plate-stack";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/money";
import { placeOrder } from "@/lib/orders/actions";
import { checkoutSchema, type CheckoutField } from "@/lib/orders/checkout";
import { cn } from "@/lib/utils";

export function CheckoutForm() {
  const { items, subtotalCents, unavailable, restaurant, ordering, demo, ready } = useCart();
  const { clear, remove } = useCartActions();
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [placed, setPlaced] = React.useState(false);
  const [errors, setErrors] = React.useState<Partial<Record<CheckoutField, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [notesLength, setNotesLength] = React.useState(0);
  const formRef = React.useRef<HTMLFormElement>(null);
  const errorRef = React.useRef<HTMLDivElement>(null);

  const orderable = items.filter((item) => item.dish.available);
  const plates = useOrderPlates();
  const blocked = ordering?.kind === "paused" || ordering?.kind === "closed" || unavailable.length > 0;

  if (placed) {
    return (
      <div role="status" className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-32 text-center">
        <Loader2 aria-hidden="true" className="size-6 animate-spin text-vermilion motion-reduce:animate-none" />
        <p className="font-display text-2xl">Sending your order to the kitchen…</p>
      </div>
    );
  }

  if (!ready) return <div className="min-h-[60vh]" aria-busy="true" />;

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-5 px-4 py-32 text-center">
        <h1 className="text-4xl tracking-tight">Your order is empty</h1>
        <p className="text-muted-foreground">Add a few plates from the belt or the menu, then come back here to order for pickup.</p>
        <Link href="/menu" className={buttonVariants({ size: "lg" })}>Explore the menu</Link>
      </div>
    );
  }

  const focusFirstError = (fields: Partial<Record<CheckoutField, string>>) => {
    const first = (["name", "phone", "notes"] as const).find((field) => fields[field]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    else errorRef.current?.focus();
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      notes: String(form.get("notes") ?? ""),
      items: orderable.map((item) => ({ dishId: item.dish.id, quantity: item.quantity })),
      expectedTotalCents: subtotalCents,
    };
    const check = checkoutSchema.safeParse(input);
    if (!check.success) {
      const next: Partial<Record<CheckoutField, string>> = {};
      for (const issue of check.error.issues) {
        const field = issue.path[0];
        if ((field === "name" || field === "phone" || field === "notes") && !next[field]) next[field] = issue.message;
      }
      setErrors(next);
      setFormError(Object.keys(next).length ? null : "Your order is empty.");
      focusFirstError(next);
      return;
    }
    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const result = await placeOrder(input);
      if (result.ok) {
        clear();
        setPlaced(true);
        router.push(`/order/${result.token}`);
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setFormError(result.fieldErrors ? null : result.message);
      // Prices or availability changed: fetch the current menu so the summary shows what will be charged.
      if (result.code === "PRICE_CHANGED" || result.code === "ITEM_UNAVAILABLE") router.refresh();
      requestAnimationFrame(() => focusFirstError(result.fieldErrors ?? {}));
    });
  };

  const field = "h-12 rounded-xl bg-card px-4 text-base";
  const panel = "rounded-[1.5rem] border border-border bg-card p-5 sm:p-7";

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-24 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] lg:gap-14 lg:px-10">
      <div className="lg:col-start-1">
        <p lang="ja" className="font-display text-sm tracking-[0.4em] text-muted-foreground">お持ち帰り</p>
        <h1 className="mt-3 text-[clamp(2.5rem,6vw,4rem)] font-extrabold leading-[0.98] tracking-[-0.02em]">Pickup order</h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          {demo ? "Your plates, ready to review. This demo store doesn't take orders." : "No account needed. Your name and number are only used to prepare this order and reach you about it."}
        </p>
      </div>

      <aside aria-labelledby="summary-title" className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <div className="overflow-hidden rounded-[1.5rem] border border-border bg-card lg:sticky lg:top-24">
          <div className="dark flex items-end gap-5 bg-ai-950 px-6 pb-5 pt-6 text-foreground">
            <PlateStack tiers={plates} width={56} max={10} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 id="summary-title" className="text-xl font-bold">Your order</h2>
              <p className="text-sm text-muted-foreground">{orderable.reduce((sum, item) => sum + item.quantity, 0)} plates · pickup</p>
            </div>
            <Link href="/menu" className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Add more</Link>
          </div>
          <div className="px-6 pb-6">
            <ul className="divide-y divide-border" aria-label="Plates">
              {items.map(({ dish, quantity, totalCents }) => (
                <li key={dish.id} data-summary-line={dish.id} className="flex items-center gap-3 py-3.5">
                  <div className={cn("relative size-11 shrink-0", !dish.available && "opacity-50 grayscale")}>
                    <Image src={dish.image} alt="" fill sizes="44px" className="object-contain" />
                    <span aria-hidden="true" className="absolute -inset-[2%] rounded-full border-2" style={{ borderColor: `var(--chart-${dish.tier})` }} />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate font-medium">{dish.name}</p>
                    {dish.available ? (
                      <p className="text-xs tabular-nums text-muted-foreground">{quantity} × {formatPrice(dish.priceCents)}</p>
                    ) : (
                      <button type="button" onClick={() => remove(dish.id)} className="text-xs font-medium text-destructive underline-offset-4 hover:underline">
                        Sold out · Remove
                      </button>
                    )}
                  </div>
                  <span className={cn("text-sm tabular-nums", !dish.available && "text-muted-foreground line-through")}>{formatPrice(totalCents)}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between border-t-2 border-dashed border-border pt-4">
              <span className="text-sm">Total, paid at pickup</span>
              <span data-checkout-total className="font-display text-3xl font-bold tabular-nums">{formatPrice(subtotalCents)}</span>
            </div>
            <div className="mt-5 space-y-1 rounded-xl bg-background p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Pickup at {restaurant.name}</p>
              {restaurant.pickupAddress && <p className="whitespace-pre-line">{restaurant.pickupAddress}</p>}
              {restaurant.pickupNotes && <p className="whitespace-pre-line">{restaurant.pickupNotes}</p>}
              <p>Usually ready in about {restaurant.prepMinutes} minutes.</p>
            </div>
          </div>
        </div>
      </aside>

      {demo ? (
        <div data-demo-checkout className="rounded-[1.5rem] border border-border bg-card p-6 sm:p-8 lg:col-start-1">
          <p className="font-display text-2xl font-bold">Ordering is off in this demo</p>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            In a real KAITEN store, guests enter a name and phone number here, place the order, and pay when they collect it. This demo store
            takes no orders and asks for no details, so your plates simply stay in your order.
          </p>
          <Link href="/" className={buttonVariants({ size: "lg", className: "mt-6" })}>Back to the belt</Link>
        </div>
      ) : (
      <form ref={formRef} onSubmit={submit} noValidate className="space-y-5 lg:col-start-1" aria-describedby={formError ? "checkout-error" : undefined}>
        <fieldset className={cn(panel, "space-y-5")} disabled={pending}>
          <legend className="float-left mb-5 w-full font-display text-xl font-bold">Your details</legend>
          <div className="clear-both space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" autoComplete="name" maxLength={80} required aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} className={field} />
            {errors.name && <p id="name-error" className="text-sm text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={30} required aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-error" : "phone-hint"} className={field} />
            {errors.phone ? (
              <p id="phone-error" className="text-sm text-destructive">{errors.phone}</p>
            ) : (
              <p id="phone-hint" className="text-xs text-muted-foreground">Only used if the restaurant needs to reach you about this order.</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="notes">Notes <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <span className="text-xs tabular-nums text-muted-foreground">{notesLength}/500</span>
            </div>
            <Textarea id="notes" name="notes" rows={3} maxLength={500} onChange={(e) => setNotesLength(e.target.value.length)} placeholder="Allergies, extra ginger, arrival time…" aria-invalid={!!errors.notes} aria-describedby={errors.notes ? "notes-error" : undefined} className="rounded-xl bg-card px-4 py-3 text-base" />
            {errors.notes && <p id="notes-error" className="text-sm text-destructive">{errors.notes}</p>}
          </div>
        </fieldset>

        <div className={panel}>
          <p className="font-display text-xl font-bold">Payment</p>
          <div className="mt-4 flex items-start gap-3 rounded-xl border-2 border-ai-900 bg-background p-4 text-sm">
            <span aria-hidden="true" className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-2 border-ai-900"><span className="size-1.5 rounded-full bg-ai-900" /></span>
            <div>
              <p className="font-medium">Pay at pickup</p>
              <p className="text-muted-foreground">Pay {formatPrice(subtotalCents)} at the counter when you collect your order. Online payment is not available.</p>
            </div>
          </div>
        </div>

        <OrderingNotice />

        {formError && (
          <div ref={errorRef} id="checkout-error" role="alert" tabIndex={-1} data-checkout-error className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive outline-none">
            {formError}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Button type="submit" size="lg" data-place-order className="h-14 w-full text-base sm:w-auto sm:px-10" disabled={pending || blocked || orderable.length === 0}>
            {pending && <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
            {pending ? "Placing order…" : `Place pickup order · ${formatPrice(subtotalCents)}`}
          </Button>
          <p className="text-xs text-muted-foreground">
            By placing this order you agree to pay {formatPrice(subtotalCents)} when you collect it.
          </p>
        </div>
      </form>
      )}
    </div>
  );
}
