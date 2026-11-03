"use client";

import { useStoreMenu } from "@/components/store/store-menu";
import { plateTiers } from "@/lib/menu";
import { formatPrice } from "@/lib/money";

/** The menu page's colour key: one chip per plate in use, cheapest first. */
export function PlateLegend() {
  const { dishes } = useStoreMenu();
  return (
    <ul aria-label="Plate colours by price" className="flex flex-wrap gap-2">
      {plateTiers(dishes).map((entry) => (
        <li key={entry.tier} className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card pl-2 pr-3.5 text-sm tabular-nums">
          <span aria-hidden="true" className="size-5 rounded-full border-[3.5px]" style={{ borderColor: `var(--chart-${entry.tier})` }} />
          {formatPrice(entry.priceCents)}
        </li>
      ))}
    </ul>
  );
}
