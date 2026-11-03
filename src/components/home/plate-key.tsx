"use client";

import { useStoreMenu } from "@/components/store/store-menu";
import { plateTiers, type Tier } from "@/lib/menu";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";

const container = "mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-10";

/** A plate seen from above, in its tier colour, with the price stamped in the well. */
function PlateFace({ tier, price, className }: { tier: Tier["id"]; price: string; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("relative grid aspect-square place-items-center rounded-full", className)} style={{ background: `var(--chart-${tier})` }}>
      <span className="absolute inset-[7%] rounded-full border border-white/30" />
      <span className="absolute inset-[17%] rounded-full shadow-[inset_0_2px_6px_rgba(0,0,0,0.18)]" style={{ background: `color-mix(in oklab, var(--chart-${tier}) 14%, #f7f3eb)` }} />
      <span className="relative font-display text-[clamp(1.25rem,2.2vw,1.9rem)] font-bold tabular-nums text-ai-950">{price}</span>
    </div>
  );
}

export function PlateKey() {
  const { dishes, tiers } = useStoreMenu();
  const used = plateTiers(dishes);
  const names = new Map(tiers.map((tier) => [tier.id, tier.name]));
  return (
    <section id="plates" aria-labelledby="plates-title" className="hinoki-grain relative py-20 text-ai-950 sm:py-28">
      <div className={container}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-ai-950/60">Read the plates</p>
            <h2 id="plates-title" className="mt-4 max-w-xl text-balance text-4xl leading-[1.05] sm:text-5xl">The colour of a plate is its price.</h2>
          </div>
          <p className="max-w-sm text-[15px] leading-relaxed text-ai-950/70">Every dish rides on one of these plates, on the belt, on the menu and in your order.</p>
        </div>
        <ul className="mt-14 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {used.map((entry) => (
            <li key={entry.tier} data-tier={entry.tier} className="flex items-center gap-5 sm:flex-col sm:items-start sm:gap-6">
              <PlateFace tier={entry.tier} price={formatPrice(entry.priceCents)} className="w-24 shrink-0 shadow-[0_14px_30px_-14px_rgba(40,25,5,0.55)] sm:w-full sm:max-w-44" />
              <div>
                <p className="font-display text-lg font-bold">{names.get(entry.tier)} plate</p>
                <p className="mt-1 text-sm leading-snug text-ai-950/70">{entry.dishes.map((dish) => dish.name).join(", ")}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
