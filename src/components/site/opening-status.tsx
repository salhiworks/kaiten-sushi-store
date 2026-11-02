"use client";

import { useCart } from "@/components/cart/cart-provider";
import { cn } from "@/lib/utils";

/** "Open · until 9:30 PM", from the restaurant's own hours and pause switch. Renders nothing until the client knows the time. */
export function OpeningStatus({ className }: { className?: string }) {
  const { ordering } = useCart();
  if (!ordering) return <span className={cn("inline-block h-5", className)} />;
  const open = ordering.kind === "open";
  const text =
    ordering.kind === "open"
      ? `Taking orders · until ${ordering.closesAt}`
      : ordering.kind === "demo"
        ? "Demo store · ordering off"
        : ordering.kind === "paused"
          ? "Orders paused"
          : ordering.opensAt
            ? `Closed · opens ${ordering.opensDay === "today" ? "" : `${ordering.opensDay} `}${ordering.opensAt}`
            : "Closed";
  return (
    <span data-opening-status={ordering.kind} className={cn("inline-flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <span aria-hidden="true" className={cn("relative size-2 rounded-full", open ? "bg-chart-3" : "bg-muted-foreground/60")}>
        {open && <span className="absolute inset-0 animate-ping rounded-full bg-chart-3/60 motion-reduce:hidden" />}
      </span>
      {text}
    </span>
  );
}
