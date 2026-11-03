"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminApi } from "./admin-api";
import { firstIssue, tiersSchema } from "@/lib/admin/schemas";
import type { Tier } from "@/lib/menu";
import { formatPrice } from "@/lib/money";

type Draft = { id: number; name: string; color: string; price: string };

export function TiersForm({ tiers, dishesByTier }: { tiers: Tier[]; dishesByTier: Record<number, string[]> }) {
  const [drafts, setDrafts] = React.useState<Draft[]>(() => tiers.map((t) => ({ id: t.id, name: t.name, color: t.color, price: (t.priceCents / 100).toFixed(2) })));
  const { saveTiers } = useAdminApi();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const update = (id: number, patch: Partial<Draft>) => setDrafts((old) => old.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const parsed = drafts.map((d) => ({ id: d.id, name: d.name, color: d.color, priceCents: Math.round(Number(d.price) * 100) }));
  const prices = parsed.map((t) => t.priceCents);
  const duplicates = new Set(prices.filter((p, i) => prices.indexOf(p) !== i));

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (drafts.some((d) => !/^\d+(\.\d{1,2})?$/.test(d.price.trim()))) return setError("Enter prices like 4.20.");
    const check = tiersSchema.safeParse(parsed);
    if (!check.success) return setError(firstIssue(check.error));
    setError(null);
    startTransition(async () => {
      const result = await saveTiers(parsed);
      if (result.ok) toast.success("Plate prices saved. The belt and menu now use them.");
      else setError(result.error);
    });
  };

  return (
    <form onSubmit={save} noValidate className="space-y-6">
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {drafts.map((d) => {
          const dishes = dishesByTier[d.id] ?? [];
          return (
            <li key={d.id} data-tier-row={d.id} className="grid items-center gap-4 p-5 sm:grid-cols-[auto_1fr_8rem_minmax(0,1.2fr)] sm:gap-6">
              <label className="relative grid size-14 cursor-pointer place-items-center rounded-full border-[5px] bg-background shadow-[inset_0_0_0_6px_var(--color-card)]" style={{ borderColor: d.color }}>
                <span className="sr-only">Colour of the {d.name} plate</span>
                <input type="color" value={d.color} onChange={(e) => update(d.id, { color: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" data-tier-color />
                <span aria-hidden="true" className="font-mono text-[10px] text-muted-foreground">{d.id}</span>
              </label>
              <div className="space-y-1.5">
                <Label htmlFor={`tier-name-${d.id}`} className="text-xs text-muted-foreground">Plate name</Label>
                <Input id={`tier-name-${d.id}`} value={d.name} maxLength={40} onChange={(e) => update(d.id, { name: e.target.value })} className="h-10 bg-background" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`tier-price-${d.id}`} className="text-xs text-muted-foreground">Price (USD)</Label>
                <div className="relative">
                  <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input id={`tier-price-${d.id}`} value={d.price} inputMode="decimal" onChange={(e) => update(d.id, { price: e.target.value })} data-tier-price className="h-10 bg-background pl-6 tabular-nums" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {dishes.length ? <><span className="text-foreground">{dishes.length} {dishes.length === 1 ? "dish" : "dishes"}:</span> {dishes.join(", ")}</> : "No dishes on this plate yet."}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="rounded-2xl border border-border bg-background p-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Colour key guests will see</p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm tabular-nums">
          {[...parsed].sort((a, b) => a.priceCents - b.priceCents).filter((t) => (dishesByTier[t.id] ?? []).length > 0).map((t) => (
            <li key={t.id} className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="size-3.5 rounded-full border-2" style={{ borderColor: t.color }} />
              {Number.isFinite(t.priceCents) && t.priceCents > 0 ? formatPrice(t.priceCents) : "—"}
            </li>
          ))}
        </ul>
        {duplicates.size > 0 && <p className="mt-3 text-sm text-vermilion">Two plates share a price. That works, but guests may find the colour key confusing.</p>}
      </div>

      {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" disabled={pending} data-save-tiers>
        {pending && <Loader2 aria-hidden="true" className="animate-spin" />}
        Save plate prices
      </Button>
    </form>
  );
}
