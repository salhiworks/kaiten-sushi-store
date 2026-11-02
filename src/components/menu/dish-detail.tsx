"use client";

import Image from "next/image";
import { AddToOrder } from "@/components/cart/add-to-order";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ALLERGEN_LABELS, TAG_LABELS, type Dish, type Tier } from "@/lib/menu";
import { formatPrice } from "@/lib/money";

/** A dish up close. A centred dialog on larger screens, a bottom sheet on phones. */
export function DishDetail({ dish, tier, open, onOpenChange }: { dish: Dish | null; tier?: Tier; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-dish-detail
        className="max-h-[92svh] gap-0 overflow-y-auto rounded-[1.75rem] border-0 bg-card p-0 ring-1 ring-foreground/10 sm:max-w-3xl max-sm:top-auto max-sm:bottom-0 max-sm:max-w-none max-sm:translate-y-0 max-sm:rounded-b-none max-sm:data-open:slide-in-from-bottom-10"
      >
        {dish && (
          <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="relative grid place-items-center bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--hinoki)_45%,transparent),transparent)] p-8 sm:p-10">
              <span aria-hidden="true" className="mx-auto mb-1 h-1 w-10 rounded-full bg-foreground/15 sm:hidden" />
              <div className="relative aspect-square w-full max-w-[17rem] sm:max-w-none">
                <span aria-hidden="true" className="absolute inset-x-[10%] bottom-[-4%] top-[16%] rounded-full bg-black/25 blur-2xl" />
                <Image src={dish.image} alt={dish.name} fill sizes="(min-width: 640px) 380px, 70vw" className="object-contain" />
                <span aria-hidden="true" className="absolute -inset-[1.5%] rounded-full border-[3px]" style={{ borderColor: `var(--chart-${dish.tier})` }} />
              </div>
            </div>
            <div className="flex flex-col gap-5 p-6 pt-2 sm:p-10 sm:pl-2">
              <div>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span aria-hidden="true" className="size-2.5 rounded-full border-2" style={{ borderColor: `var(--chart-${dish.tier})` }} />
                  {tier ? `${tier.name} plate` : "Plate"}
                  {dish.tags.length > 0 && <span className="text-foreground/30">·</span>}
                  {dish.tags.map((tag) => <span key={tag}>{TAG_LABELS[tag]}</span>)}
                </p>
                <DialogTitle className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">{dish.name}</DialogTitle>
                {dish.nameJa && <p lang="ja" className="mt-1 font-display text-base text-muted-foreground">{dish.nameJa}</p>}
              </div>
              <DialogDescription className="text-[15px] leading-relaxed text-muted-foreground">{dish.description}</DialogDescription>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-y border-border py-4 text-sm">
                <dt className="text-muted-foreground">Portion</dt>
                <dd>{dish.portion}</dd>
                <dt className="text-muted-foreground">Contains</dt>
                <dd data-detail-allergens className="font-medium">{dish.allergens.map((a) => ALLERGEN_LABELS[a]).join(", ") || "No listed allergens"}</dd>
              </dl>
              <div className="mt-auto flex items-center justify-between gap-4">
                <span className="font-display text-3xl font-bold tabular-nums">{formatPrice(dish.priceCents)}</span>
                <AddToOrder dish={dish} className="h-11 px-5" />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
