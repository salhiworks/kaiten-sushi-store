"use client";

import * as React from "react";
import Image from "next/image";
import { AddToOrder } from "@/components/cart/add-to-order";
import { ALLERGEN_LABELS, TAG_LABELS, type Dish, type Tier } from "@/lib/menu";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import { DishDetail } from "./dish-detail";
import { useStoreMenu } from "@/components/store/store-menu";

type Filter = string;

export function MenuBrowser() {
  const { categories, dishes, tiers } = useStoreMenu();
  const [filter, setFilter] = React.useState<Filter>("all");
  const [selected, setSelected] = React.useState<Dish | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const tierById = React.useMemo(() => new Map(tiers.map((tier) => [tier.id, tier])), [tiers]);

  const groups = categories
    .map((category) => ({ category, dishes: dishes.filter((dish) => dish.category === category.id) }))
    .filter((group) => group.dishes.length > 0);
  const visible = filter === "all" ? groups : groups.filter((group) => group.category.id === filter);
  const shown = visible.reduce((sum, group) => sum + group.dishes.length, 0);
  const options = [{ id: "all", label: "All", count: dishes.length }, ...groups.map((g) => ({ id: g.category.id, label: g.category.label, count: g.dishes.length }))];
  // Keep the open dish in sync with the latest menu (price or stock may change while it is open).
  const current = selected ? dishes.find((dish) => dish.id === selected.id) ?? selected : null;

  const openDish = (dish: Dish) => {
    setSelected(dish);
    setDetailOpen(true);
  };

  return (
    <>
      <div className="sticky top-16 z-30 border-y border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-[90rem]">
          <div role="group" aria-label="Filter by category" data-menu-filters className="flex gap-1.5 overflow-x-auto px-4 py-3 [scrollbar-width:none] sm:px-6 lg:px-10">
            {options.map((option) => {
              const active = filter === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  data-filter={option.id}
                  onClick={() => setFilter(option.id)}
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                    active ? "bg-ai-900 text-kinari" : "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground",
                  )}
                >
                  {option.label}
                  <span className={cn("text-xs tabular-nums", active ? "text-kinari/55" : "text-muted-foreground/60")}>{option.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {filter === "all" ? `Showing all ${shown} dishes` : `Showing ${shown} ${shown === 1 ? "dish" : "dishes"} in ${visible[0]?.category.label}`}
      </p>

      <div className="mx-auto max-w-[90rem] space-y-16 px-4 py-12 sm:space-y-24 sm:px-6 sm:py-16 lg:px-10">
        {visible.map(({ category, dishes: list }) => (
          <section key={category.id} aria-labelledby={`cat-${category.id}`} data-category={category.id} className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12">
            <div className="lg:sticky lg:top-36 lg:self-start">
              <div className="flex items-baseline gap-3 lg:block">
                <h2 id={`cat-${category.id}`} className="text-3xl leading-none sm:text-4xl">{category.label}</h2>
                <p lang="ja" className="font-display text-lg text-muted-foreground lg:mt-3">{category.labelJa}</p>
              </div>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground lg:mt-4">{category.description}</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
              {list.map((dish) => <DishCard key={dish.id} dish={dish} tier={tierById.get(dish.tier)} onOpen={() => openDish(dish)} />)}
            </ul>
          </section>
        ))}
      </div>

      <DishDetail dish={current} tier={current ? tierById.get(current.tier) : undefined} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  );
}

function DishCard({ dish, tier, onOpen }: { dish: Dish; tier?: Tier; onOpen: () => void }) {
  const allergens = dish.allergens.map((a) => ALLERGEN_LABELS[a]).join(", ");
  return (
    <li
      data-dish-id={dish.id}
      data-sold-out={!dish.available || undefined}
      className="group/card relative flex gap-4 rounded-[1.5rem] border border-border bg-card p-3 pr-4 transition-shadow hover:shadow-[0_18px_40px_-24px_rgba(15,22,40,0.35)] sm:flex-col sm:gap-0 sm:p-0 sm:pr-0"
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`View ${dish.name}`}
        data-open-dish
        className="relative grid size-28 shrink-0 place-items-center overflow-hidden rounded-[1.1rem] bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--hinoki)_40%,transparent),transparent)] outline-none focus-visible:ring-2 focus-visible:ring-ring sm:aspect-[5/4] sm:size-auto sm:w-full sm:rounded-b-none sm:rounded-t-[1.5rem]"
      >
        <span className={cn("relative block aspect-square h-[86%] transition-transform duration-500 ease-out group-hover/card:rotate-[8deg] group-hover/card:scale-[1.03] motion-reduce:transition-none sm:h-[80%]", !dish.available && "opacity-55 grayscale-[0.7]")}>
          <span aria-hidden="true" className="absolute inset-x-[12%] bottom-[-3%] top-[20%] rounded-full bg-black/20 blur-xl" />
          <Image src={dish.image} alt={dish.name} fill sizes="(min-width: 1280px) 260px, (min-width: 640px) 30vw, 112px" className="object-contain" />
          <span aria-hidden="true" className="absolute -inset-[2%] rounded-full border-[2.5px]" style={{ borderColor: `var(--chart-${dish.tier})` }} />
        </span>
        {!dish.available && <span className="absolute left-3 top-3 rounded-full bg-ai-900 px-2.5 py-1 text-[11px] font-medium text-kinari">Sold out</span>}
      </button>

      <div className="flex min-w-0 flex-1 flex-col sm:p-5 sm:pt-4">
        <div className="flex items-baseline gap-3">
          <h3 className="min-w-0 text-lg leading-snug sm:text-xl">{dish.name}</h3>
          <span className="ml-auto shrink-0 font-display text-lg font-bold tabular-nums">{formatPrice(dish.priceCents)}</span>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span aria-hidden="true" className="size-2 rounded-full border-[1.5px]" style={{ borderColor: `var(--chart-${dish.tier})` }} />
          {tier ? `${tier.name} plate` : null}
          {dish.nameJa && <span lang="ja" className="font-display">· {dish.nameJa}</span>}
        </p>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{dish.description}</p>
        <dl className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          <div className="flex gap-1">
            <dt className="sr-only">Portion</dt>
            <dd className="text-muted-foreground">{dish.portion}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="text-muted-foreground">Contains</dt>
            <dd data-allergens className="font-medium text-foreground">{allergens}</dd>
          </div>
        </dl>
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-3 sm:pt-5">
          <AddToOrder dish={dish} />
          {dish.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-foreground/[0.05] px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{TAG_LABELS[tag]}</span>
          ))}
        </div>
      </div>
    </li>
  );
}
