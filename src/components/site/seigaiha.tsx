import { cn } from "@/lib/utils";

/** Seigaiha (青海波) wave pattern, drawn in currentColor. Purely decorative. */
export function Seigaiha({ className, fill = "var(--sumi)" }: { className?: string; fill?: string }) {
  const id = "seigaiha";
  const scale = (cx: number, cy: number) => (
    <g key={`${cx}-${cy}`} transform={`translate(${cx} ${cy})`}>
      <circle r="20" style={{ fill }} />
      {[19, 14.5, 10, 5.5].map((r) => <circle key={r} r={r} fill="none" stroke="currentColor" strokeWidth="1" />)}
    </g>
  );
  return (
    <svg aria-hidden="true" className={cn("pointer-events-none", className)}>
      <defs>
        <pattern id={id} width="40" height="20" patternUnits="userSpaceOnUse">
          {[[0, 0], [40, 0], [20, 10], [0, 20], [40, 20]].map(([x, y]) => scale(x, y))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
