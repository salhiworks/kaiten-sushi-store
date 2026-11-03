"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Seal } from "@/components/site/brand-mark";
import { Switch } from "@/components/ui/switch";
import { useAdminApi } from "./admin-api";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "", label: "Orders" },
  { href: "/menu", label: "Menu" },
  { href: "/plates", label: "Plates & prices" },
  { href: "/categories", label: "Categories" },
  { href: "/settings", label: "Restaurant" },
];

export function AdminShell({ restaurantName, acceptingOrders, email, signOut, banner, children }: {
  restaurantName: string;
  acceptingOrders: boolean;
  email: string;
  /** Real admin only. The demo has no account to sign out of. */
  signOut?: () => Promise<void>;
  /** Shown above the header, e.g. the demo admin's notice. */
  banner?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { base, demo, setAcceptingOrders } = useAdminApi();
  // Flips immediately; falls back to the server value by itself if saving fails.
  const [accepting, setAccepting] = React.useOptimistic(acceptingOrders);
  const [pending, startTransition] = React.useTransition();

  const toggle = (next: boolean) => {
    startTransition(async () => {
      setAccepting(next);
      const result = await setAcceptingOrders(next);
      if (!result.ok) {
        toast.error(result.error);
      } else {
        toast.success(next ? "Taking new orders again." : "New orders are paused. Guests can still browse the menu.");
      }
    });
  };

  return (
    <>
      {banner}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href={base} className="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Seal />
            <span className="truncate font-display text-lg">{restaurantName}</span>
            <span className={cn("hidden rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] sm:inline", demo ? "bg-hinoki text-ai-950" : "bg-muted text-muted-foreground")}>{demo ? "Demo admin" : "Admin"}</span>
          </Link>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <label className={cn("flex h-9 items-center gap-2.5 rounded-full border px-3 text-sm", accepting ? "border-chart-3/40 bg-chart-3/10" : "border-vermilion/40 bg-vermilion/10")}>
              <Switch checked={accepting} onCheckedChange={toggle} disabled={pending} aria-label="Take new orders" data-accepting-toggle />
              <span className="whitespace-nowrap font-medium">{accepting ? "Taking orders" : "Orders paused"}</span>
            </label>
            <Link href="/" target={demo ? undefined : "_blank"} className="hidden items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground md:inline-flex">
              View site <ExternalLink aria-hidden="true" className="size-3.5" />
            </Link>
            {signOut && <form action={signOut}>
              <button type="submit" title={`Signed in as ${email}`} className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                <LogOut aria-hidden="true" className="size-4" />
                <span className="sr-only">Sign out</span>
              </button>
            </form>}
          </div>
        </div>
        <nav aria-label="Admin" className="mx-auto max-w-6xl">
          <ul className="flex gap-1 overflow-x-auto px-2 [scrollbar-width:none] sm:px-4">
            {NAV.map((item) => {
              const href = `${base}${item.href}`;
              const current = item.href === "" ? pathname === base : pathname.startsWith(href);
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "relative block px-3 py-3 text-sm outline-none transition-colors focus-visible:text-foreground",
                      current ? "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-vermilion" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-10 sm:px-6">{children}</main>
    </>
  );
}

export function AdminShellFallback() {
  return (
    <div aria-busy="true" className="flex-1">
      <div className="h-[6.5rem] border-b border-border" />
    </div>
  );
}

export function AdminPageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
