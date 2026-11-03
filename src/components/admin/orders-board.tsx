"use client";

import * as React from "react";
import Link from "next/link";
import { Phone, RefreshCw } from "lucide-react";
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
import { useAdminApi } from "./admin-api";
import type { AdminOrder, OrderView } from "@/lib/admin/data";
import type { OrderStatus } from "@/lib/admin/schemas";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";

const VIEWS: { key: OrderView; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "collected", label: "Collected" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS: Record<OrderStatus, { label: string; tone: string; next?: { status: OrderStatus; label: string } }> = {
  new: { label: "New", tone: "bg-vermilion text-vermilion-foreground", next: { status: "preparing", label: "Start preparing" } },
  preparing: { label: "Preparing", tone: "bg-chart-5/20 text-foreground", next: { status: "ready", label: "Mark ready" } },
  ready: { label: "Ready", tone: "bg-chart-3/20 text-foreground", next: { status: "collected", label: "Mark collected" } },
  collected: { label: "Collected", tone: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelled", tone: "bg-muted text-muted-foreground line-through" },
};

function timeAgo(iso: string, now: number) {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours} h ${minutes % 60} min ago` : new Date(iso).toLocaleDateString();
}

export function OrdersBoard({ view, orders, counts }: { view: OrderView; orders: AdminOrder[]; counts: Record<OrderView, number> }) {
  const { base, refresh } = useAdminApi();
  const [refreshing, startRefresh] = React.useTransition();
  const [now, setNow] = React.useState<number | null>(null);

  // Poll for new orders and keep "x min ago" current.
  React.useEffect(() => {
    const tick = () => {
      setNow(Date.now());
      if (refresh) startRefresh(refresh);
    };
    const first = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(tick, 20_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [refresh]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Order views" className="flex gap-2">
          {VIEWS.map((item) => (
            <Link
              key={item.key}
              href={item.key === "active" ? base : `${base}?view=${item.key}`}
              aria-current={view === item.key ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                view === item.key ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
              <span className={cn("text-xs tabular-nums", view === item.key ? "text-background/60" : "text-muted-foreground/70")}>{counts[item.key]}</span>
            </Link>
          ))}
        </nav>
        {refresh && (
          <Button variant="ghost" size="sm" onClick={() => startRefresh(refresh)} disabled={refreshing} className="text-muted-foreground">
            <RefreshCw aria-hidden="true" className={cn(refreshing && "animate-spin motion-reduce:animate-none")} />
            Refresh
          </Button>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-display text-xl">{view === "active" ? "No open orders" : "Nothing here yet"}</p>
          <p className="mt-2 text-sm text-muted-foreground">{view === "active" ? "New pickup orders appear here automatically." : "Orders move here as you complete or cancel them."}</p>
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2" aria-label="Orders">
          {orders.map((order) => <OrderCard key={order.id} order={order} now={now} />)}
        </ul>
      )}
    </div>
  );
}

function OrderCard({ order, now }: { order: AdminOrder; now: number | null }) {
  const { setOrderStatus } = useAdminApi();
  const [pending, startTransition] = React.useTransition();
  const meta = STATUS[order.status];
  const update = (status: OrderStatus, message: string) =>
    startTransition(async () => {
      const result = await setOrderStatus(order.id, status);
      if (result.ok) toast.success(message);
      else toast.error(result.error);
    });

  return (
    <li data-admin-order={order.reference} data-status={order.status} className={cn("flex flex-col rounded-2xl border border-border bg-card p-5 transition-opacity", pending && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-lg font-medium tracking-[0.1em]">{order.reference}</p>
          <p className="text-xs text-muted-foreground">
            {/* Local time only after mount, so the server's time zone never leaks into the markup. */}
            {now === null ? "\u00a0" : `${new Date(order.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · ${timeAgo(order.createdAt, now)}`}
          </p>
        </div>
        <span data-status-badge className={cn("rounded-full px-2.5 py-1 text-xs font-medium", meta.tone)}>{meta.label}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
        <span className="font-medium">{order.customerName}</span>
        <a href={`tel:${order.customerPhone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          <Phone aria-hidden="true" className="size-3.5" />
          {order.customerPhone}
        </a>
      </div>

      <ul className="mt-4 divide-y divide-border border-y border-border text-sm">
        {order.items.map((item, index) => (
          <li key={index} className="flex gap-3 py-2">
            <span className="w-8 shrink-0 font-medium tabular-nums">{item.quantity}×</span>
            <span className="flex-1">{item.name}</span>
            <span className="tabular-nums text-muted-foreground">{formatPrice(item.lineTotalCents)}</span>
          </li>
        ))}
      </ul>
      {order.notes && <p className="mt-3 rounded-lg bg-chart-5/10 px-3 py-2 text-sm"><span className="font-medium">Note: </span>{order.notes}</p>}

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Pay at pickup</span>
        <span className="font-display text-xl tabular-nums">{formatPrice(order.totalCents)}</span>
      </div>

      {(meta.next || order.status === "cancelled" || order.status === "collected") && (
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          {meta.next && (
            <Button size="lg" disabled={pending} onClick={() => update(meta.next!.status, `${order.reference}: ${STATUS[meta.next!.status].label.toLowerCase()}.`)}>
              {meta.next.label}
            </Button>
          )}
          {(order.status === "collected" || order.status === "cancelled") && (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => update("ready", `${order.reference} moved back to ready.`)} className="text-muted-foreground">
              Reopen as ready
            </Button>
          )}
          {meta.next && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" disabled={pending} className="ml-auto text-muted-foreground hover:text-destructive">Cancel order</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel order {order.reference}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The guest will see that the order was cancelled. Consider calling {order.customerName} on {order.customerPhone} first.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep order</AlertDialogCancel>
                  <AlertDialogAction onClick={() => update("cancelled", `${order.reference} cancelled.`)}>Cancel order</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </li>
  );
}
