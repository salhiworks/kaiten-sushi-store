/**
 * Cart lines persisted in localStorage. Only dish ids and quantities are stored; names and prices
 * are always read from the current catalog, so a saved cart never shows a stale price.
 */

export interface CartLine {
  dishId: string;
  quantity: number;
}

export const MAX_QUANTITY = 20;

const STORAGE_KEY = "kaiten:cart";
const VERSION = 1;
const EMPTY: CartLine[] = [];

let lines: CartLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function parse(raw: string | null): CartLine[] {
  if (!raw) return EMPTY;
  try {
    const data = JSON.parse(raw);
    if (data?.v !== VERSION || !Array.isArray(data.lines)) return EMPTY;
    const out: CartLine[] = [];
    for (const line of data.lines) {
      if (typeof line?.dishId !== "string" || !Number.isInteger(line.quantity) || line.quantity < 1) continue;
      if (out.some((l) => l.dishId === line.dishId)) continue;
      out.push({ dishId: line.dishId, quantity: Math.min(line.quantity, MAX_QUANTITY) });
    }
    return out;
  } catch {
    return EMPTY;
  }
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    lines = parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    lines = EMPTY;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function commit(next: CartLine[]) {
  load();
  lines = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: VERSION, lines }));
  } catch {
    // Storage can be full or blocked; the cart still works for this visit.
  }
  emit();
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  lines = parse(event.newValue);
  emit();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function getSnapshot() {
  load();
  return lines;
}

export function getServerSnapshot() {
  return EMPTY;
}

export function addLine(dishId: string, quantity = 1) {
  load();
  const current = lines.find((l) => l.dishId === dishId);
  if (!current) commit([...lines, { dishId, quantity: Math.min(quantity, MAX_QUANTITY) }]);
  else setLineQuantity(dishId, current.quantity + quantity);
}

export function setLineQuantity(dishId: string, quantity: number) {
  load();
  if (quantity < 1) return removeLine(dishId);
  const next = Math.min(Math.floor(quantity), MAX_QUANTITY);
  commit(lines.map((l) => (l.dishId === dishId ? { ...l, quantity: next } : l)));
}

export function removeLine(dishId: string) {
  load();
  commit(lines.filter((l) => l.dishId !== dishId));
}

export function clearLines() {
  commit(EMPTY);
}
