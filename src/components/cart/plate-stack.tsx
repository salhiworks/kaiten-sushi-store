"use client";

import { cn } from "@/lib/utils";
import { useCart } from "./cart-provider";

/**
 * At a kaiten counter you stack your empty plates and the stack is your bill. KAITEN draws the
 * guest's order the same way: one plate per item, in its price colour, newest on top.
 */
export function PlateStack({
  tiers,
  width = 96,
  max = 12,
  className,
  animateTop = true,
  showOverflow = true,
}: {
  tiers: number[];
  width?: number;
  max?: number;
  className?: string;
  animateTop?: boolean;
  /** Show "+n" when there are more plates than fit. Off where a count is already shown next to the stack. */
  showOverflow?: boolean;
}) {
  const shown = tiers.slice(-max);
  const extra = tiers.length - shown.length;
  const W = 100;
  const ry = 15;
  const thickness = 6;
  const step = 8.5;
  const height = ry * 2 + thickness + Math.max(0, shown.length - 1) * step + 2;
  const scale = width / W;

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)} aria-hidden="true">
      {shown.length === 0 ? (
        <svg width={width} height={(ry * 2 + thickness + 2) * scale} viewBox={`0 0 ${W} ${ry * 2 + thickness + 2}`} className="overflow-visible">
          <ellipse cx={W / 2} cy={ry + 1} rx={W / 2 - 1} ry={ry} fill="none" stroke="currentColor" strokeOpacity={0.6} strokeWidth={1.5} strokeDasharray="4 3" />
        </svg>
      ) : (
        <svg width={width} height={height * scale} viewBox={`0 0 ${W} ${height}`} className="overflow-visible">
          {shown.map((tier, index) => {
            const cy = height - ry - thickness - 1 - index * step;
            const color = `var(--chart-${tier})`;
            const top = index === shown.length - 1;
            return (
              <g key={index} data-plate={tier} className={cn(top && animateTop && "animate-plate-drop")} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
                {/* Rim side */}
                <ellipse cx={W / 2} cy={cy + thickness} rx={W / 2 - 1} ry={ry} style={{ fill: `color-mix(in oklab, ${color} 62%, black)` }} />
                <rect x={1} y={cy} width={W - 2} height={thickness} style={{ fill: `color-mix(in oklab, ${color} 62%, black)` }} />
                {/* Top of the plate: coloured rim, pale well, a soft highlight */}
                <ellipse cx={W / 2} cy={cy} rx={W / 2 - 1} ry={ry} style={{ fill: color }} />
                <ellipse cx={W / 2} cy={cy + 0.8} rx={W * 0.33} ry={ry * 0.62} style={{ fill: `color-mix(in oklab, ${color} 18%, #f6f2ea)` }} />
                <ellipse cx={W / 2} cy={cy} rx={W / 2 - 2.5} ry={ry - 1.5} fill="none" stroke="white" strokeOpacity={0.28} strokeWidth={0.8} />
              </g>
            );
          })}
        </svg>
      )}
      {showOverflow && extra > 0 && (
        <span className="absolute -right-3 top-0 rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-background">+{extra}</span>
      )}
    </div>
  );
}

/** The plate tiers of the current order, one entry per plate, in the order they were added. */
export function useOrderPlates() {
  const { items } = useCart();
  return items.filter((item) => item.dish.available).flatMap((item) => Array.from({ length: item.quantity }, () => item.dish.tier));
}
