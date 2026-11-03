"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminApi } from "./admin-api";
import { categorySchema, firstIssue, slugify, type CategoryInput } from "@/lib/admin/schemas";
import type { MenuCategory } from "@/lib/menu";

export function CategoriesManager({ categories, counts }: { categories: MenuCategory[]; counts: Record<string, number> }) {
  const [pending, startTransition] = React.useTransition();
  const run = (work: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    startTransition(async () => {
      const result = await work();
      if (result.ok) toast.success(success);
      else toast.error(result.error ?? "Saving failed.");
    });

  return (
    <div className="space-y-8">
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {categories.map((category, index) => (
          <CategoryRow
            key={category.id}
            category={category}
            count={counts[category.id] ?? 0}
            first={index === 0}
            last={index === categories.length - 1}
            pending={pending}
            run={run}
          />
        ))}
      </ul>
      <NewCategory pending={pending} run={run} />
    </div>
  );
}

type Run = (work: () => Promise<{ ok: boolean; error?: string }>, success: string) => void;

function CategoryRow({ category, count, first, last, pending, run }: { category: MenuCategory; count: number; first: boolean; last: boolean; pending: boolean; run: Run }) {
  const { moveCategory, deleteCategory, updateCategory } = useAdminApi();
  const [draft, setDraft] = React.useState<CategoryInput>(category);
  const dirty = draft.label !== category.label || draft.labelJa !== category.labelJa || draft.description !== category.description;
  const save = () => {
    const check = categorySchema.safeParse(draft);
    if (!check.success) return toast.error(firstIssue(check.error));
    run(() => updateCategory(draft), `${draft.label} saved.`);
  };
  return (
    <li data-admin-category={category.id} className="grid gap-3 p-4 sm:grid-cols-[auto_1fr_8rem_1.6fr_auto] sm:items-center sm:gap-4 sm:p-5">
      <div className="flex gap-1">
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move ${category.label} up`} disabled={first || pending} onClick={() => run(() => moveCategory(category.id, -1), "Order updated.")}><ArrowUp aria-hidden="true" /></Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move ${category.label} down`} disabled={last || pending} onClick={() => run(() => moveCategory(category.id, 1), "Order updated.")}><ArrowDown aria-hidden="true" /></Button>
      </div>
      <Input aria-label="Name" value={draft.label} maxLength={40} onChange={(e) => setDraft({ ...draft, label: e.target.value })} className="h-10 bg-background" />
      <Input aria-label="Japanese name" lang="ja" value={draft.labelJa} maxLength={20} placeholder="日本語" onChange={(e) => setDraft({ ...draft, labelJa: e.target.value })} className="h-10 bg-background" />
      <Input aria-label="Description" value={draft.description} maxLength={200} placeholder="One line for the menu page" onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="h-10 bg-background" />
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" disabled={!dirty || pending} onClick={save}>Save</Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete ${category.label}`}
          title={count ? `Move its ${count} dishes to another category first` : undefined}
          disabled={count > 0 || pending}
          onClick={() => run(() => deleteCategory(category.id), `${category.label} deleted.`)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 aria-hidden="true" />
        </Button>
        <span className="w-14 text-xs text-muted-foreground">{count} {count === 1 ? "dish" : "dishes"}</span>
      </div>
    </li>
  );
}

function NewCategory({ pending, run }: { pending: boolean; run: Run }) {
  const { createCategory } = useAdminApi();
  const [label, setLabel] = React.useState("");
  const [labelJa, setLabelJa] = React.useState("");
  const [description, setDescription] = React.useState("");
  const add = (event: React.FormEvent) => {
    event.preventDefault();
    const input = { id: slugify(label), label, labelJa, description };
    const check = categorySchema.safeParse(input);
    if (!check.success) return toast.error(firstIssue(check.error));
    run(async () => {
      const result = await createCategory(input);
      if (result.ok) {
        setLabel("");
        setLabelJa("");
        setDescription("");
      }
      return result;
    }, `${label} added.`);
  };
  return (
    <form onSubmit={add} className="rounded-2xl border border-dashed border-border p-5">
      <p className="mb-4 font-display text-lg">Add a category</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem_1.6fr_auto]">
        <Input aria-label="New category name" placeholder="Sashimi" value={label} maxLength={40} onChange={(e) => setLabel(e.target.value)} className="h-10 bg-card" />
        <Input aria-label="Japanese name" lang="ja" placeholder="刺身" value={labelJa} maxLength={20} onChange={(e) => setLabelJa(e.target.value)} className="h-10 bg-card" />
        <Input aria-label="Description" placeholder="Sliced raw fish, no rice." value={description} maxLength={200} onChange={(e) => setDescription(e.target.value)} className="h-10 bg-card" />
        <Button type="submit" disabled={pending || !label.trim()} className="h-10"><Plus aria-hidden="true" />Add</Button>
      </div>
    </form>
  );
}
