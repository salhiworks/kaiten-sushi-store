"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageUp, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createDish, deleteDish, discardUpload, updateDish } from "@/lib/admin/actions";
import type { AdminDish } from "@/lib/admin/data";
import { dishSchema, firstIssue, slugify, type DishInput } from "@/lib/admin/schemas";
import { ALLERGEN_LABELS, TAG_LABELS, type MenuCategory, type PlateTier, type Tier } from "@/lib/menu";
import { DISH_IMAGE_BUCKET, PLACEHOLDER_IMAGE } from "@/lib/menu/images";
import { ALLERGENS, DISH_TAGS } from "@/lib/menu/types";
import { formatPrice } from "@/lib/money";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

const PHOTO_TYPES: Record<string, string> = { "image/png": "png", "image/webp": "webp", "image/jpeg": "jpg", "image/avif": "avif" };
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function DishForm({ dish, categories, tiers }: { dish: AdminDish | null; categories: MenuCategory[]; tiers: Tier[] }) {
  const router = useRouter();
  const creating = dish === null;
  const [values, setValues] = React.useState<DishInput>(() => ({
    id: dish?.id ?? "",
    name: dish?.name ?? "",
    nameJa: dish?.nameJa ?? "",
    description: dish?.description ?? "",
    category: dish?.category ?? categories[0]?.id ?? "",
    tier: dish?.tier ?? 1,
    portion: dish?.portion ?? "",
    allergens: dish?.allergens ?? [],
    tags: dish?.tags ?? [],
    available: dish?.available ?? true,
    visible: dish?.visible ?? true,
    imagePath: dish?.imagePath ?? null,
  }));
  const [idEdited, setIdEdited] = React.useState(!creating);
  const [photo, setPhoto] = React.useState<{ file: File; url: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleting, startDelete] = React.useTransition();
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url); }, [photo]);

  const set = <K extends keyof DishInput>(key: K, value: DishInput[K]) => setValues((old) => ({ ...old, [key]: value }));
  const toggleIn = (key: "allergens" | "tags", item: string, on: boolean) =>
    setValues((old) => {
      const list = old[key] as string[];
      return { ...old, [key]: on ? [...new Set([...list, item])] : list.filter((x) => x !== item) };
    });

  const tier = tiers.find((t) => t.id === values.tier);
  const preview = photo?.url ?? dish?.imageUrl ?? PLACEHOLDER_IMAGE;

  const choosePhoto = (file: File | undefined) => {
    if (!file) return;
    if (!PHOTO_TYPES[file.type]) return toast.error("Use a PNG, WebP, JPEG or AVIF image.");
    if (file.size > MAX_PHOTO_BYTES) return toast.error("That photo is over 5 MB. Please use a smaller file.");
    setPhoto({ file, url: URL.createObjectURL(file) });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const draft = { ...values, imagePath: photo ? "dishes/pending.webp" : values.imagePath };
    const check = dishSchema.safeParse(draft);
    if (!check.success) return setError(firstIssue(check.error));

    setSaving(true);
    let uploaded: string | null = null;
    try {
      if (photo) {
        uploaded = `dishes/${check.data.id}-${Date.now().toString(36)}.${PHOTO_TYPES[photo.file.type]}`;
        const { error: uploadError } = await createBrowserSupabase().storage.from(DISH_IMAGE_BUCKET).upload(uploaded, photo.file, { contentType: photo.file.type, cacheControl: "31536000" });
        if (uploadError) {
          uploaded = null;
          throw new Error("The photo could not be uploaded. Please try again.");
        }
      }
      const input = { ...values, imagePath: uploaded ?? values.imagePath };
      const result = creating ? await createDish(input) : await updateDish(input);
      if (!result.ok) throw new Error(result.error);
      toast.success(creating ? `${values.name} added to the menu.` : `${values.name} saved.`);
      router.push("/admin/menu");
    } catch (failure) {
      if (uploaded) await discardUpload(uploaded);
      setError(failure instanceof Error ? failure.message : "Saving failed. Please try again.");
      setSaving(false);
    }
  };

  const remove = () =>
    startDelete(async () => {
      const result = await deleteDish(values.id);
      if (!result.ok) return void toast.error(result.error);
      toast.success(`${values.name} removed from the menu.`);
      router.push("/admin/menu");
    });

  const input = "h-10 bg-card px-3 text-base sm:text-sm";

  return (
    <form onSubmit={save} noValidate className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-8">
        <fieldset disabled={saving} className="space-y-5 rounded-2xl border border-border bg-card/60 p-5 sm:p-6">
          <legend className="sr-only">Dish details</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="dish-name">Name</Label>
              <Input
                id="dish-name"
                value={values.name}
                maxLength={80}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (!idEdited) set("id", slugify(e.target.value));
                }}
                className={input}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dish-name-ja">Japanese name <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="dish-name-ja" lang="ja" value={values.nameJa} maxLength={40} onChange={(e) => set("nameJa", e.target.value)} className={input} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dish-portion">Portion</Label>
              <Input id="dish-portion" value={values.portion} maxLength={40} placeholder="2 pieces" onChange={(e) => set("portion", e.target.value)} className={input} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="dish-description">Description</Label>
              <Textarea id="dish-description" value={values.description} maxLength={300} rows={3} onChange={(e) => set("description", e.target.value)} className="bg-card px-3 text-base sm:text-sm" />
              <p className="text-right text-xs tabular-nums text-muted-foreground">{values.description.length}/300</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dish-category">Category</Label>
              <select id="dish-category" value={values.category} onChange={(e) => set("category", e.target.value)} className={cn(input, "w-full rounded-lg border border-input outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50")}>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dish-id">Web name</Label>
              <Input
                id="dish-id"
                value={values.id}
                disabled={!creating}
                maxLength={60}
                onChange={(e) => {
                  setIdEdited(true);
                  set("id", e.target.value.toLowerCase());
                }}
                aria-describedby="dish-id-hint"
                className={cn(input, "font-mono")}
              />
              <p id="dish-id-hint" className="text-xs text-muted-foreground">{creating ? "Used in saved orders. It can't be changed later." : "Fixed, so saved carts and past orders still match."}</p>
            </div>
          </div>
        </fieldset>

        <fieldset disabled={saving} className="rounded-2xl border border-border bg-card/60 p-5 sm:p-6">
          <legend className="float-left mb-1 w-full font-display text-lg">Plate colour and price</legend>
          <p className="clear-both mb-4 text-sm text-muted-foreground">
            The plate colour sets the price, just like on the belt. <Link href="/admin/plates" className="underline underline-offset-4 hover:text-foreground">Change plate prices</Link>
          </p>
          <div role="radiogroup" aria-label="Plate colour" className="grid gap-2 sm:grid-cols-5">
            {tiers.map((t) => (
              <label key={t.id} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors sm:flex-col sm:text-center", values.tier === t.id ? "border-foreground bg-background" : "border-border hover:border-foreground/40")}>
                <input type="radio" name="tier" value={t.id} checked={values.tier === t.id} onChange={() => set("tier", t.id as PlateTier)} className="sr-only" />
                <span aria-hidden="true" className="size-7 shrink-0 rounded-full border-[3px] bg-card" style={{ borderColor: t.color }} />
                <span className="flex-1 sm:flex-none">{t.name}</span>
                <span className="font-medium tabular-nums">{formatPrice(t.priceCents)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset disabled={saving} className="rounded-2xl border border-border bg-card/60 p-5 sm:p-6">
          <legend className="float-left mb-1 w-full font-display text-lg">Allergens</legend>
          <p className="clear-both mb-4 text-sm text-muted-foreground">Tick everything the dish contains. Guests see this on the menu and the belt.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ALLERGENS.map((allergen) => (
              <label key={allergen} className="flex items-center gap-2.5 text-sm">
                <Checkbox checked={(values.allergens as string[]).includes(allergen)} onCheckedChange={(on) => toggleIn("allergens", allergen, on === true)} />
                {ALLERGEN_LABELS[allergen]}
              </label>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-5">
            {DISH_TAGS.map((tag) => (
              <label key={tag} className="flex items-center gap-2.5 text-sm">
                <Checkbox checked={(values.tags as string[]).includes(tag)} onCheckedChange={(on) => toggleIn("tags", tag, on === true)} />
                {TAG_LABELS[tag]}
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p role="alert" data-form-error className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={saving} data-save-dish>
            {saving && <Loader2 aria-hidden="true" className="animate-spin" />}
            {creating ? "Add dish" : "Save changes"}
          </Button>
          <Link href="/admin/menu" className="px-3 text-sm text-muted-foreground hover:text-foreground">Cancel</Link>
          {!creating && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" className="ml-auto text-muted-foreground hover:text-destructive" disabled={deleting || saving}>
                  <Trash2 aria-hidden="true" />
                  Delete dish
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {values.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the dish and its photo for good. Past orders keep their record. To take it off the menu for a while, switch off &ldquo;On menu&rdquo; instead.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep dish</AlertDialogCancel>
                  <AlertDialogAction onClick={remove}>Delete dish</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-36 lg:self-start">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-4 font-display text-lg">Photo</p>
          <div className="relative mx-auto aspect-square w-full max-w-60">
            <Image src={preview} alt="" fill sizes="240px" className="object-contain" unoptimized={!!photo} />
            <span aria-hidden="true" className="absolute -inset-[2%] rounded-full border-[3px]" style={{ borderColor: tier?.color }} />
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/webp,image/jpeg,image/avif" className="sr-only" data-photo-input onChange={(e) => choosePhoto(e.target.files?.[0])} tabIndex={-1} />
          <Button type="button" variant="outline" className="mt-5 w-full bg-background" disabled={saving} onClick={() => fileRef.current?.click()}>
            <ImageUp aria-hidden="true" />
            {photo || dish?.imagePath ? "Replace photo" : "Upload photo"}
          </Button>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Best: a square, top-down photo of the plate on a transparent background (PNG or WebP), at least 800 × 800 px, up to 5 MB.
          </p>
          {photo && <p className="mt-2 text-xs font-medium text-foreground">New photo selected. It is uploaded when you save.</p>}
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 text-sm">
          <label className="flex items-start justify-between gap-4">
            <span>
              <span className="block font-medium">In stock</span>
              <span className="text-muted-foreground">Off: shown as sold out and can&apos;t be ordered.</span>
            </span>
            <Switch checked={values.available} onCheckedChange={(on) => set("available", on)} disabled={saving} />
          </label>
          <label className="flex items-start justify-between gap-4 border-t border-border pt-4">
            <span>
              <span className="block font-medium">On menu</span>
              <span className="text-muted-foreground">Off: hidden from guests entirely.</span>
            </span>
            <Switch checked={values.visible} onCheckedChange={(on) => set("visible", on)} disabled={saving} />
          </label>
        </div>
      </aside>
    </form>
  );
}
