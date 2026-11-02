import { ALLERGEN_LABELS, plateTiers, type Dish, type Tier } from "@/lib/menu";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";

const container = "mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-10";

/** Small line drawings for the four steps, drawn in currentColor. */
function StepGlyph({ step }: { step: number }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg aria-hidden="true" viewBox="0 0 64 40" className="h-10 w-16">
      {step === 0 && (
        <>
          <rect x="3" y="8" width="58" height="24" rx="12" {...common} />
          <rect x="15" y="16" width="34" height="8" rx="4" {...common} />
          <ellipse cx="13" cy="20" rx="5" ry="3" {...common} />
          <ellipse cx="51" cy="20" rx="5" ry="3" {...common} />
        </>
      )}
      {step === 1 && (
        <>
          <ellipse cx="32" cy="30" rx="18" ry="5" {...common} strokeDasharray="3 3" />
          <ellipse cx="32" cy="17" rx="18" ry="5" {...common} />
          <path d="M32 4v6M28 7l4-3 4 3" {...common} />
        </>
      )}
      {step === 2 && (
        <>
          <ellipse cx="32" cy="12" rx="16" ry="4.5" {...common} />
          <path d="M16 12v5c0 2.5 7.2 4.5 16 4.5s16-2 16-4.5v-5" {...common} />
          <path d="M16 21v5c0 2.5 7.2 4.5 16 4.5s16-2 16-4.5v-5" {...common} />
          <path d="M16 30v3c0 2.5 7.2 4.5 16 4.5s16-2 16-4.5v-3" {...common} />
        </>
      )}
      {step === 3 && (
        <>
          <path d="M10 4h44" {...common} />
          <path d="M14 4v20M24 4v24M34 4v24M44 4v20" {...common} />
          <path d="M14 24c3 4 7 4 10 4M44 24c-3 4-7 4-10 4" {...common} />
          <path d="M8 36h48" {...common} />
        </>
      )}
    </svg>
  );
}

const STEPS = [
  { numeral: "一", title: "Watch the belt", body: "Plates circle the counter, each one a single serving. Stop the belt or spin it to see what's coming." },
  { numeral: "二", title: "Lift a plate", body: "Open any plate to see what's on it, how many pieces it holds and which allergens it contains." },
  { numeral: "三", title: "Stack your plates", body: "Each plate you add joins your stack. The colour is the price, so your stack is your bill." },
  { numeral: "四", title: "Collect at the counter", body: "Order for pickup with your name and phone number, then pay when you collect." },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="py-20 sm:py-28">
      <div className={cn(container, "grid gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-20")}>
        <div>
          <p lang="ja" className="font-display text-sm tracking-[0.4em] text-muted-foreground">回転寿司</p>
          <h2 id="how-title" className="mt-4 text-balance text-4xl leading-[1.05] sm:text-5xl">How the counter works</h2>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
            <span lang="ja">Kaiten</span> means rotation. Small plates travel past every seat, and you take whatever catches your eye. Here, you order them for pickup.
          </p>
        </div>
        <ol className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
          {STEPS.map((step, index) => (
            <li key={step.title} className="grid grid-cols-[auto_1fr] gap-x-5 border-t border-foreground/15 pt-6">
              <span lang="ja" aria-hidden="true" className="row-span-3 w-10 font-display text-4xl font-extrabold leading-none text-foreground/40">{step.numeral}</span>
              <span className="sr-only">Step {index + 1}: </span>
              <h3 className="text-xl">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{step.body}</p>
              <div className="col-start-2 mt-5 hidden text-foreground/45 sm:block">
                <StepGlyph step={index} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

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

export function PlateKey({ dishes, tiers }: { dishes: Dish[]; tiers: Tier[] }) {
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

const CRAFT = [
  { mark: "舎利", title: "Shari, the rice", body: "Seasoned with vinegar, a little sugar and salt while still warm, then kept close to body temperature so every grain stays distinct." },
  { mark: "ネタ", title: "Neta, the topping", body: "Cut for its texture: thinner for firm fish, thicker for soft, and always sized to sit neatly on the rice beneath it." },
  { mark: "手", title: "Te, the hand", body: "Pressed by hand with just enough pressure to hold together on the plate and fall apart once you taste it." },
];

export function CraftSection() {
  return (
    <section aria-labelledby="craft-title" className="py-20 sm:py-28">
      <div className={container}>
        <h2 id="craft-title" className="max-w-xl text-balance text-4xl leading-[1.05] sm:text-5xl">Three things make a plate.</h2>
        <ul className="mt-14 grid gap-px overflow-hidden rounded-[1.75rem] border border-border bg-border md:grid-cols-3">
          {CRAFT.map((item) => (
            <li key={item.title} className="flex gap-6 bg-card p-7 sm:p-9 md:flex-col md:gap-10">
              <span lang="ja" aria-hidden="true" className="vertical-text font-display text-5xl font-bold leading-none text-ai-800 md:text-6xl md:[writing-mode:horizontal-tb]">{item.mark}</span>
              <div>
                <h3 className="text-xl">{item.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Allergen line used across the storefront. */
export function allergenText(dish: Dish) {
  return dish.allergens.map((a) => ALLERGEN_LABELS[a]).join(", ");
}
