import type { Metadata } from "next";
import { MenuBrowser } from "@/components/menu/menu-browser";
import { ALLERGEN_LABELS, plateTiers } from "@/lib/menu";
import { getMenu } from "@/lib/menu/server";
import { formatPrice } from "@/lib/money";

export const metadata: Metadata = {
  title: "Menu",
  description: "Nigiri, rolls, small plates and dessert, with prices and allergens for every dish.",
};

export default async function MenuPage() {
  const { categories, dishes, tiers } = await getMenu();
  const allergens = [...new Set(dishes.flatMap((dish) => dish.allergens))].map((a) => ALLERGEN_LABELS[a].toLowerCase());

  return (
    <>
      <header className="mx-auto grid max-w-[90rem] gap-8 px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-10">
        <div>
          <p lang="ja" className="font-display text-sm tracking-[0.4em] text-muted-foreground">お品書き</p>
          <h1 className="mt-3 text-[clamp(3rem,8vw,6rem)] font-extrabold leading-[0.95] tracking-[-0.02em]">The menu</h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Every plate from the belt, with what&apos;s on it and what it contains. Tap a dish for a closer look.
          </p>
        </div>
        <ul aria-label="Plate colours by price" className="flex flex-wrap gap-2">
          {plateTiers(dishes).map((entry) => (
            <li key={entry.tier} className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card pl-2 pr-3.5 text-sm tabular-nums">
              <span aria-hidden="true" className="size-5 rounded-full border-[3.5px]" style={{ borderColor: `var(--chart-${entry.tier})` }} />
              {formatPrice(entry.priceCents)}
            </li>
          ))}
        </ul>
      </header>

      <MenuBrowser categories={categories} dishes={dishes} tiers={tiers} />

      <aside aria-label="Allergen information" className="mx-auto max-w-[90rem] px-4 pb-24 sm:px-6 lg:px-10">
        <div className="max-w-2xl rounded-[1.5rem] border border-border bg-card p-6 text-sm leading-relaxed text-muted-foreground sm:p-8">
          <p className="font-display text-lg font-bold text-foreground">A note on allergens</p>
          <p className="mt-2">
            Each dish lists its main allergens. The menu as a whole includes {allergens.slice(0, -1).join(", ")} and {allergens.at(-1)}, and dishes
            are prepared side by side, so traces may be present. If you have a severe allergy, please check with the restaurant before
            ordering.
          </p>
        </div>
      </aside>
    </>
  );
}
