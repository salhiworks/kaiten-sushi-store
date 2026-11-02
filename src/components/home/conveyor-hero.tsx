"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useCart, useCartActions } from "@/components/cart/cart-provider";
import { PlateStack, useOrderPlates } from "@/components/cart/plate-stack";
import SushiConveyorMenu, { type ConveyorDish } from "@/components/ui/sushi-conveyor-menu";
import type { Dish } from "@/lib/menu";
import { toConveyorDish } from "@/lib/menu/conveyor";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";

const TOUCH_QUERY = "(hover: none) and (pointer: coarse)";

/** True on phones and tablets. False during server rendering, so the first paint matches. */
function useTouchDevice() {
  return React.useSyncExternalStore(
    (notify) => {
      const media = window.matchMedia(TOUCH_QUERY);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    () => window.matchMedia(TOUCH_QUERY).matches,
    () => false,
  );
}

/**
 * The night counter: the belt under a warm pendant light, and in front of it the hinoki counter
 * where the guest's plates stack up.
 */
export function ConveyorHero({ dishes }: { dishes: Dish[] }) {
  const { add } = useCartActions();
  const touch = useTouchDevice();
  // Only plates that can be ordered ride the belt. Stable items: the conveyor re-lays out the belt whenever this array changes.
  const items = React.useMemo(() => dishes.filter((dish) => dish.available).map(toConveyorDish), [dishes]);
  const onAdd = React.useCallback((item: ConveyorDish) => add(item.id), [add]);

  return (
    <section aria-labelledby="hero-title" className="dark relative isolate overflow-hidden bg-ai-950 text-foreground">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {/* Pendant light over the belt, and the faint indigo of the noren at the edges. */}
        <div className="absolute inset-x-0 top-0 h-[78%] bg-[radial-gradient(52%_60%_at_50%_42%,rgba(232,206,160,0.17),transparent_72%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,transparent_55%,rgba(5,9,20,0.55))]" />
      </div>

      <div className="mx-auto max-w-[90rem] px-4 pt-9 text-center sm:px-6 sm:pt-12">
        <p className="animate-rise text-[11px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
          <span lang="ja" className="tracking-[0.4em]">回転寿司</span> · Conveyor sushi for pickup
        </p>
        <h1 id="hero-title" className="animate-rise mx-auto mt-4 max-w-5xl text-balance text-[clamp(2.6rem,5.4vw,5rem)] font-extrabold leading-[0.98] tracking-[-0.02em] [animation-delay:80ms]">
          Take a plate as it passes.
        </h1>
      </div>

      <SushiConveyorMenu
        id="belt"
        items={items}
        caption={touch ? "Tap a plate to lift it, then tap it again to open it. Swipe to spin the belt." : "Hover to stop the belt, flick to spin it, click a plate to open it."}
        chipHint={touch ? "Tap to open" : "Click to open"}
        dialogClassName="dark"
        autoplay
        onAdd={onAdd}
        className={cn(
          // A section narrower than 1024px keeps the conveyor in its centred stage layout, with plates up to ~143px.
          "mx-auto max-w-[1010px] bg-transparent! [&>div[aria-hidden]:first-child]:hidden",
          // The island in the middle of the belt is the chef's hinoki counter.
          "[--island:#e3cfa6]! [--island-low:#cdb07e]! [--island-wall:#8a6c42]!",
          // Phones and tablets: run the belt to the screen edges and fade its ends rather than cutting them off.
          "[&[data-layout=stack]_div:has(>[data-stage])]:w-[calc(100%+2rem)] [&[data-layout=stack]_div:has(>[data-stage])]:max-w-none",
          "max-sm:[&[data-layout=stack]_div:has(>[data-stage])]:[mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)]",
        )}
      />

      <CounterRail />
    </section>
  );
}

/** The counter in front of the belt: the guest's plate stack, their total and where to go next. */
function CounterRail() {
  const { count, subtotalCents, ready } = useCart();
  const { setOpen } = useCartActions();
  const plates = useOrderPlates();
  const has = ready && count > 0;

  return (
    <div id="counter-rail" className="relative mt-2 px-4 pb-10 sm:px-6 sm:pb-14">
      <div className="hinoki-grain mx-auto flex max-w-[1010px] flex-wrap items-center gap-x-4 gap-y-3 rounded-[1.75rem] px-5 py-4 text-ai-950 shadow-[0_-1px_0_rgba(255,255,255,0.35)_inset,0_24px_60px_-28px_rgba(0,0,0,0.8)] sm:gap-6 sm:px-7 sm:py-5">
        <div className="flex w-16 shrink-0 items-end justify-center self-stretch sm:w-20">
          <PlateStack tiers={plates} width={64} max={9} className="text-ai-950/60" />
        </div>
        <div className="min-w-0 flex-1" aria-live="polite">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ai-950/60">Your plates</p>
          {has ? (
            <p className="mt-0.5 font-display text-xl font-bold leading-tight sm:text-2xl">
              {count} {count === 1 ? "plate" : "plates"} <span className="text-ai-950/50">·</span> <span className="tabular-nums">{formatPrice(subtotalCents)}</span>
            </p>
          ) : (
            <p className="mt-0.5 text-sm leading-snug text-ai-950/75 sm:text-base">
              <span className="sm:hidden">Add a plate from the belt.</span>
              <span className="hidden sm:inline">Lift a plate from the belt and add it. It lands here, ready for pickup.</span>
            </p>
          )}
        </div>
        {has ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-ai-950 px-5 text-sm font-medium text-kinari max-sm:basis-full outline-none transition-transform hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-ai-700 focus-visible:ring-offset-2 focus-visible:ring-offset-hinoki motion-reduce:transition-none"
          >
            Review order
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
        ) : (
          <Link
            href="/menu"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-ai-950/25 px-4 text-sm sm:px-5 font-medium outline-none transition-colors hover:bg-ai-950/[0.06] focus-visible:ring-2 focus-visible:ring-ai-700"
          >
            <span><span className="hidden sm:inline">Explore the </span><span className="sm:hidden">Full </span>menu</span>
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
