"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { TierRing } from "@/components/site/brand-mark";
import { Switch } from "@/components/ui/switch";
import { useAdminApi } from "./admin-api";
import type { AdminDish } from "@/lib/admin/data";
import type { MenuCategory, Tier } from "@/lib/menu";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";

export function DishList({ dishes, categories, tiers }: { dishes: AdminDish[]; categories: MenuCategory[]; tiers: Tier[] }) {
  const tierById = new Map(tiers.map((tier) => [tier.id, tier]));
  if (dishes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
        <p className="font-display text-xl">No dishes yet</p>
        <p className="mt-2 text-sm text-muted-foreground">Add your first dish to put it on the belt.</p>
      </div>
    );
  }
  return (
    <div className="space-y-12">
      {categories.map((category) => {
        const list = dishes.filter((dish) => dish.category === category.id);
        if (list.length === 0) return null;
        return (
          <section key={category.id} aria-labelledby={`admin-cat-${category.id}`}>
            <h2 id={`admin-cat-${category.id}`} className="mb-3 flex items-baseline gap-3 text-xl">
              {category.label}
              <span className="text-sm text-muted-foreground">{list.length}</span>
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {list.map((dish) => <DishRow key={dish.id} dish={dish} tier={tierById.get(dish.tier)} />)}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function DishRow({ dish, tier }: { dish: AdminDish; tier?: Tier }) {
  const { base, setDishFlags } = useAdminApi();
  const [flags, setFlags] = React.useOptimistic({ available: dish.available, visible: dish.visible });
  const [, startTransition] = React.useTransition();

  const change = (patch: { available?: boolean; visible?: boolean }, message: string) =>
    startTransition(async () => {
      setFlags((current) => ({ ...current, ...patch }));
      const result = await setDishFlags(dish.id, patch);
      if (result.ok) toast.success(message);
      else toast.error(result.error);
    });

  return (
    <li data-admin-dish={dish.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-4 sm:px-5">
      <div className={cn("relative size-14 shrink-0", (!flags.available || !flags.visible) && "opacity-50 grayscale")}>
        <Image src={dish.imageUrl} alt="" fill sizes="56px" className="object-contain" />
        <TierRing tier={dish.tier} className="absolute -inset-[2%] size-auto" />
      </div>
      <div className="min-w-0 flex-1 basis-40">
        <p className="truncate font-medium">{dish.name}</p>
        <p className="text-xs text-muted-foreground">
          {tier ? `${tier.name} plate · ${formatPrice(tier.priceCents)}` : "No plate colour"}
          {!flags.visible && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 font-medium">Hidden</span>}
          {flags.visible && !flags.available && <span className="ml-2 rounded-full bg-vermilion/10 px-2 py-0.5 font-medium text-vermilion">Sold out</span>}
        </p>
      </div>
      <div className="flex items-center gap-5 text-sm">
        <label className="flex items-center gap-2">
          <Switch checked={flags.available} onCheckedChange={(available) => change({ available }, available ? `${dish.name} is back in stock.` : `${dish.name} is marked sold out.`)} data-toggle="available" />
          <span className="text-muted-foreground">In stock</span>
        </label>
        <label className="flex items-center gap-2">
          <Switch checked={flags.visible} onCheckedChange={(visible) => change({ visible }, visible ? `${dish.name} is on the menu.` : `${dish.name} is hidden from guests.`)} data-toggle="visible" />
          <span className="text-muted-foreground">On menu</span>
        </label>
        <Link href={`${base}/menu/${dish.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3.5 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
          <Pencil aria-hidden="true" className="size-3.5" />
          Edit
        </Link>
      </div>
    </li>
  );
}
