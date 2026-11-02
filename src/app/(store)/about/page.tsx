import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getRestaurant } from "@/lib/menu/server";

export const metadata: Metadata = {
  title: "About",
  description: "What kaiten-zushi is, how to use the belt, and when to collect your order.",
};

const ACCESS = [
  { title: "Mouse or trackpad", body: "Hover to stop the belt and lift a plate, click to open it, drag or flick to spin the belt." },
  { title: "Touch", body: "Tap a plate to lift it and tap again to open it. Swipe across the belt to spin it." },
  { title: "Keyboard", body: "Tab to the belt, use the arrow keys to move from plate to plate, Enter to open one and Escape to put it back." },
  { title: "Reduced motion", body: "If your device asks for less motion, the belt stands still and plates only move when you ask them to." },
];

export default async function AboutPage() {
  const restaurant = await getRestaurant();
  return (
    <>
      <header className="dark relative overflow-hidden bg-ai-950 text-foreground">
        <div className="mx-auto grid max-w-[90rem] gap-10 px-4 pb-20 pt-14 sm:px-6 sm:pb-28 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">About {restaurant.name}</p>
            <h1 className="mt-5 max-w-4xl text-balance text-[clamp(2.75rem,7vw,6rem)] font-extrabold leading-[0.96] tracking-[-0.02em]">
              Sushi that comes round to you.
            </h1>
            <div className="mt-10 grid max-w-3xl gap-6 text-[15px] leading-relaxed text-muted-foreground sm:grid-cols-2">
              <p>
                Conveyor-belt sushi, <span lang="ja">回転寿司</span> or kaiten-zushi, began in Osaka in the late 1950s. Instead of ordering from a
                list, guests sit along a moving counter and take small plates as they pass.
              </p>
              <p>
                {restaurant.name} brings that counter to the screen. The belt is the menu: it keeps turning, stops when you reach for something,
                and every plate you take joins your stack, ready to collect.
              </p>
            </div>
          </div>
          <p aria-hidden="true" lang="ja" className="vertical-text hidden self-start font-display text-8xl font-extrabold leading-none text-white/[0.06] lg:block">
            回転寿司
          </p>
        </div>
      </header>

      <section aria-labelledby="access-title" className="mx-auto max-w-[90rem] px-4 py-20 sm:px-6 sm:py-28 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-20">
          <div>
            <h2 id="access-title" className="text-balance text-4xl leading-[1.05] sm:text-5xl">A belt for every hand.</h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted-foreground">Every dish is also listed on the menu page, with its allergens, for anyone who prefers a plain list.</p>
            <Link href="/menu" className={buttonVariants({ size: "lg", className: "mt-8" })}>Browse the menu</Link>
          </div>
          <dl className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {ACCESS.map((item) => (
              <div key={item.title} className="border-t border-foreground/15 pt-5">
                <dt className="font-display text-xl font-bold">{item.title}</dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="visit-title" className="hinoki-grain text-ai-950">
        <div className="mx-auto grid max-w-[90rem] gap-10 px-4 py-20 sm:px-6 sm:py-24 md:grid-cols-2 lg:px-10">
          <div>
            <h2 id="visit-title" className="text-balance text-4xl leading-[1.05] sm:text-5xl">Collect at the counter.</h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ai-950/75">
              Order online, and we&apos;ll have your plates ready in about {restaurant.prepMinutes} minutes. Pay when you collect.
            </p>
            {restaurant.pickupAddress && <p className="mt-6 whitespace-pre-line font-medium">{restaurant.pickupAddress}</p>}
            {restaurant.pickupNotes && <p className="mt-2 whitespace-pre-line text-sm text-ai-950/75">{restaurant.pickupNotes}</p>}
          </div>
          <div className="flex flex-col items-start justify-end gap-4 md:items-end">
            <Link href="/" className={buttonVariants({ size: "lg", className: "h-12 px-7 text-base" })}>Start at the belt</Link>
            <p className="text-sm text-ai-950/70">Opening hours are at the bottom of every page.</p>
          </div>
        </div>
      </section>
    </>
  );
}
