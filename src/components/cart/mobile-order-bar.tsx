"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ChevronUp } from "lucide-react";
import { formatPrice } from "@/lib/money";
import { useCart, useCartActions } from "./cart-provider";
import { PlateStack, useOrderPlates } from "./plate-stack";

/** Phones: once there is something in the order, keep it one thumb-tap away at the bottom of the screen. */
export function MobileOrderBar() {
  return (
    <React.Suspense fallback={null}>
      <Bar />
    </React.Suspense>
  );
}

/** On the home page the counter under the belt already shows the order; stay out of its way while it is on screen. */
function useCounterRailVisible(pathname: string) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const rail = document.getElementById("counter-rail");
    if (!rail) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(rail);
    return () => {
      observer.disconnect();
      setVisible(false);
    };
  }, [pathname]);
  return visible;
}

function Bar() {
  const pathname = usePathname();
  const { count, subtotalCents, open, ready, demo } = useCart();
  const { setOpen } = useCartActions();
  const plates = useOrderPlates();
  const railVisible = useCounterRailVisible(pathname);
  const hidden = !ready || count === 0 || open || railVisible || pathname === "/checkout" || pathname.startsWith("/order/");
  if (hidden) return null;

  return (
    <>
      <div aria-hidden="true" className="h-24 md:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <button
          type="button"
          data-mobile-order-bar
          onClick={() => setOpen(true)}
          className="dark flex w-full animate-rise items-center gap-4 rounded-full bg-ai-950 py-2.5 pl-4 pr-2.5 text-left text-foreground shadow-[0_18px_40px_-14px_rgba(15,22,40,0.65)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <PlateStack tiers={plates} width={34} max={6} showOverflow={false} className="shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{count} {count === 1 ? "plate" : "plates"}</span>
            <span className="block text-xs tabular-nums text-muted-foreground">{formatPrice(subtotalCents)} · {demo ? "demo store" : "pay at pickup"}</span>
          </span>
          <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-hinoki px-4 text-sm font-bold text-ai-950">
            Review
            <ChevronUp aria-hidden="true" className="size-4" />
          </span>
        </button>
      </div>
    </>
  );
}
