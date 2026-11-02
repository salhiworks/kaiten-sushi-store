import type { OpeningDay, RestaurantSettings } from "@/lib/menu";

export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_INDEX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Day of week (0 = Monday) and minutes past midnight in the restaurant's time zone. */
function localNow(timezone: string, now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  return { day: WEEKDAY_INDEX[get("weekday")] ?? 0, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export function formatTime(hhmm: string) {
  const minutes = toMinutes(hhmm);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${((h + 11) % 12) + 1}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
}

export type OrderingState =
  | { kind: "open"; closesAt: string }
  | { kind: "closed"; opensAt: string | null; opensDay: string | null }
  | { kind: "paused"; message: string }
  /** The public demo build: browsing works, ordering is off. */
  | { kind: "demo" };

/** Mirrors restaurant_is_open() in the database, which has the final say when an order is placed. */
export function orderingState(settings: RestaurantSettings, now = new Date()): OrderingState {
  if (!settings.acceptingOrders) return { kind: "paused", message: settings.pausedMessage };
  const { day, minutes } = localNow(settings.timezone, now);
  const today = settings.openingHours[day];
  if (today && !today.closed && minutes >= toMinutes(today.open) && minutes < toMinutes(today.close)) {
    return { kind: "open", closesAt: formatTime(today.close) };
  }
  for (let offset = 0; offset < 7; offset++) {
    const index = (day + offset) % 7;
    const entry = settings.openingHours[index];
    if (!entry || entry.closed) continue;
    if (offset === 0 && minutes >= toMinutes(entry.open)) continue;
    return { kind: "closed", opensAt: formatTime(entry.open), opensDay: offset === 0 ? "today" : offset === 1 ? "tomorrow" : DAY_NAMES[index] };
  }
  return { kind: "closed", opensAt: null, opensDay: null };
}

/** Groups consecutive days with the same hours: "Mon–Thu · 11:30 AM – 9:30 PM". */
export function hoursSummary(days: OpeningDay[]) {
  const label = (d: OpeningDay) => (d.closed ? "Closed" : `${formatTime(d.open)} – ${formatTime(d.close)}`);
  const rows: { days: string; hours: string }[] = [];
  let start = 0;
  for (let i = 1; i <= days.length; i++) {
    if (i < days.length && label(days[i]) === label(days[start])) continue;
    rows.push({ days: start === i - 1 ? SHORT[start] : `${SHORT[start]}–${SHORT[i - 1]}`, hours: label(days[start]) });
    start = i;
  }
  return rows;
}
