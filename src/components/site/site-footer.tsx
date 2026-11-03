"use client";

import Link from "next/link";
import { OpenCartButton } from "@/components/cart/cart-button";
import { useCart } from "@/components/cart/cart-provider";
import { useStoreMenu } from "@/components/store/store-menu";
import { hoursSummary } from "@/lib/restaurant/hours";
import { BrandMark } from "./brand-mark";
import { OpeningStatus } from "./opening-status";

export function SiteFooter() {
  const { restaurant } = useStoreMenu();
  const { demo } = useCart();
  const link = "outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:underline";
  const label = "mb-4 text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground";
  return (
    <footer className="dark relative overflow-hidden bg-ai-950 text-foreground">
      {/* The split of a noren curtain, as a quiet top edge. */}
      <div aria-hidden="true" className="grid h-3 grid-cols-4 gap-1.5 bg-ai-950">
        {Array.from({ length: 4 }, (_, i) => <span key={i} className="rounded-b-sm bg-ai-800" />)}
      </div>
      <div className="mx-auto grid max-w-[90rem] gap-12 px-4 pb-12 pt-16 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-10">
        <div className="space-y-6">
          <BrandMark name={restaurant.name} />
          <p className="max-w-sm font-display text-2xl font-bold leading-snug">Conveyor sushi, ordered from the belt and collected at the counter.</p>
          <OpeningStatus />
        </div>

        <div className="text-sm">
          <p className={label}>Pickup</p>
          <ul className="space-y-2.5 text-muted-foreground">
            {restaurant.pickupAddress && <li className="whitespace-pre-line text-foreground">{restaurant.pickupAddress}</li>}
            {restaurant.phone && <li><a href={`tel:${restaurant.phone.replace(/[^\d+]/g, "")}`} className={link}>{restaurant.phone}</a></li>}
            <li>Pay when you collect</li>
            <li><OpenCartButton className={link}>Your order</OpenCartButton></li>
          </ul>
        </div>

        <div className="text-sm">
          <p className={label}>Hours</p>
          <dl className="space-y-2.5">
            {hoursSummary(restaurant.openingHours).map((row) => (
              <div key={row.days} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{row.days}</dt>
                <dd className="tabular-nums">{row.hours}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-6 text-xs text-muted-foreground sm:px-6 lg:px-10">
          <nav aria-label="Footer">
            <ul className="flex gap-6">
              <li><Link href="/" className={link}>Home</Link></li>
              <li><Link href="/menu" className={link}>Menu</Link></li>
              <li><Link href="/about" className={link}>About</Link></li>
              {demo && <li><Link href="/demo/admin" className={link}>Admin demo</Link></li>}
            </ul>
          </nav>
          <p>© {restaurant.name} <span lang="ja" className="ml-3 font-display tracking-[0.3em]">回転寿司</span></p>
        </div>
      </div>
    </footer>
  );
}
