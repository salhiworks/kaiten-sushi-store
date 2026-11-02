"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { saveSettings } from "@/lib/admin/actions";
import { firstIssue, settingsSchema } from "@/lib/admin/schemas";
import type { RestaurantSettings } from "@/lib/menu";
import { DAY_NAMES } from "@/lib/restaurant/hours";

// A fixed list renders identically on the server and in every browser.
const ZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Phoenix", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu",
  "America/Toronto", "America/Vancouver", "America/Mexico_City", "America/Sao_Paulo",
  "Europe/London", "Europe/Dublin", "Europe/Lisbon", "Europe/Paris", "Europe/Madrid", "Europe/Berlin", "Europe/Amsterdam", "Europe/Rome", "Europe/Stockholm",
  "Africa/Casablanca", "Africa/Johannesburg", "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Asia/Hong_Kong", "Asia/Seoul", "Asia/Tokyo",
  "Australia/Perth", "Australia/Sydney", "Pacific/Auckland",
];

export function SettingsForm({ settings }: { settings: RestaurantSettings }) {
  const [values, setValues] = React.useState(settings);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const zones = ZONES.includes(settings.timezone) ? ZONES : [settings.timezone, ...ZONES];

  const set = <K extends keyof RestaurantSettings>(key: K, value: RestaurantSettings[K]) => setValues((old) => ({ ...old, [key]: value }));
  const setDay = (index: number, patch: Partial<RestaurantSettings["openingHours"][number]>) =>
    setValues((old) => ({ ...old, openingHours: old.openingHours.map((day, i) => (i === index ? { ...day, ...patch } : day)) }));

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const check = settingsSchema.safeParse(values);
    if (!check.success) {
      const issue = check.error.issues[0];
      const day = issue?.path[0] === "openingHours" && typeof issue.path[1] === "number" ? `${DAY_NAMES[issue.path[1]]}: ` : "";
      return setError(day + firstIssue(check.error));
    }
    setError(null);
    startTransition(async () => {
      const result = await saveSettings(values);
      if (result.ok) toast.success("Restaurant details saved.");
      else setError(result.error);
    });
  };

  const input = "h-10 bg-background px-3 text-base sm:text-sm";
  const card = "space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6";

  return (
    <form onSubmit={save} noValidate className="grid gap-6 lg:grid-cols-2">
      <fieldset disabled={pending} className={card}>
        <legend className="float-left mb-1 w-full font-display text-lg">Taking orders</legend>
        <label className="clear-both flex items-start justify-between gap-4 text-sm">
          <span>
            <span className="block font-medium">Accept new pickup orders</span>
            <span className="text-muted-foreground">Turn off to pause orders for a while. Guests can still browse.</span>
          </span>
          <Switch checked={values.acceptingOrders} onCheckedChange={(on) => set("acceptingOrders", on)} />
        </label>
        <div className="space-y-2">
          <Label htmlFor="paused-message">Message while paused <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Input id="paused-message" value={values.pausedMessage} maxLength={200} placeholder="We're fully booked tonight. Back tomorrow at 11:30." onChange={(e) => set("pausedMessage", e.target.value)} className={input} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prep">Usual preparation time (minutes)</Label>
          <Input id="prep" type="number" min={5} max={240} value={values.prepMinutes} onChange={(e) => set("prepMinutes", Number(e.target.value))} className={`${input} w-32`} />
        </div>
      </fieldset>

      <fieldset disabled={pending} className={card}>
        <legend className="float-left mb-1 w-full font-display text-lg">Restaurant and pickup</legend>
        <div className="clear-both space-y-2">
          <Label htmlFor="restaurant-name">Restaurant name</Label>
          <Input id="restaurant-name" value={values.name} maxLength={40} onChange={(e) => set("name", e.target.value)} className={input} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pickup-address">Pickup address</Label>
          <Textarea id="pickup-address" rows={2} value={values.pickupAddress} maxLength={200} onChange={(e) => set("pickupAddress", e.target.value)} className="bg-background px-3 text-base sm:text-sm" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pickup-notes">Pickup instructions <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Textarea id="pickup-notes" rows={2} value={values.pickupNotes} maxLength={300} placeholder="Collect at the counter by the entrance." onChange={(e) => set("pickupNotes", e.target.value)} className="bg-background px-3 text-base sm:text-sm" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="restaurant-phone">Phone <span className="font-normal text-muted-foreground">(shown to guests)</span></Label>
          <Input id="restaurant-phone" type="tel" value={values.phone} maxLength={40} onChange={(e) => set("phone", e.target.value)} className={input} />
        </div>
      </fieldset>

      <fieldset disabled={pending} className={`${card} lg:col-span-2`}>
        <legend className="float-left mb-1 w-full font-display text-lg">Opening hours</legend>
        <div className="clear-both flex flex-wrap items-center gap-3 text-sm">
          <Label htmlFor="timezone">Hours are in</Label>
          <select id="timezone" value={values.timezone} onChange={(e) => set("timezone", e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
            {zones.map((zone) => <option key={zone} value={zone}>{zone.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <ul className="divide-y divide-border">
          {values.openingHours.map((day, index) => (
            <li key={DAY_NAMES[index]} data-day={index} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3 text-sm">
              <span className="w-28 font-medium">{DAY_NAMES[index]}</span>
              <label className="flex items-center gap-2 text-muted-foreground">
                <Checkbox checked={day.closed} onCheckedChange={(on) => setDay(index, { closed: on === true })} />
                Closed
              </label>
              {!day.closed && (
                <span className="flex items-center gap-2">
                  <Input type="time" aria-label={`${DAY_NAMES[index]} opening time`} value={day.open} onChange={(e) => setDay(index, { open: e.target.value })} className="h-9 w-32 bg-background" />
                  <span className="text-muted-foreground">to</span>
                  <Input type="time" aria-label={`${DAY_NAMES[index]} closing time`} value={day.close} onChange={(e) => setDay(index, { close: e.target.value })} className="h-9 w-32 bg-background" />
                </span>
              )}
            </li>
          ))}
        </ul>
      </fieldset>

      <div className="space-y-4 lg:col-span-2">
        {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" disabled={pending} data-save-settings>
          {pending && <Loader2 aria-hidden="true" className="animate-spin" />}
          Save restaurant details
        </Button>
      </div>
    </form>
  );
}
