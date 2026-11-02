import { cn } from "@/lib/utils";

/** The hanko-style seal: 回 ("turn"), drawn as two nested squares so it needs no font. */
export function Seal({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className={cn("size-7 shrink-0", className)}>
      <rect width="32" height="32" rx="6" className="fill-vermilion" />
      <rect x="7.5" y="7.5" width="17" height="17" rx="1" fill="none" strokeWidth="2.4" className="stroke-vermilion-foreground" />
      <rect x="12.6" y="12.6" width="6.8" height="6.8" rx="0.5" fill="none" strokeWidth="2.2" className="stroke-vermilion-foreground" />
    </svg>
  );
}

export function BrandMark({ name = "KAITEN", className }: { name?: string; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <Seal />
      <span className="truncate font-display text-[1.05rem] font-semibold uppercase tracking-[0.34em]">{name}</span>
    </span>
  );
}

/** Small uppercase label with a vermilion rule, used above section headings. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground", className)}>
      <span aria-hidden="true" className="h-px w-6 bg-vermilion" />
      {children}
    </p>
  );
}

/** Ring in a plate-tier colour, matching the rings the conveyor draws. */
export function TierRing({ tier, className }: { tier: number; className?: string }) {
  const ring = ["border-chart-1", "border-chart-2", "border-chart-3", "border-chart-4", "border-chart-5"][tier - 1];
  return <span aria-hidden="true" className={cn("inline-block shrink-0 rounded-full border-2", ring, className)} />;
}
