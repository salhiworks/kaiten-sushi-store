"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu as MenuIcon, X } from "lucide-react";
import { CartButton } from "@/components/cart/cart-button";
import { useCart } from "@/components/cart/cart-provider";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { hoursSummary } from "@/lib/restaurant/hours";
import { cn } from "@/lib/utils";
import { BrandMark } from "./brand-mark";
import { OpeningStatus } from "./opening-status";

export const NAV = [
  { href: "/", label: "Home", ja: "回転" },
  { href: "/menu", label: "Menu", ja: "品書" },
  { href: "/about", label: "About", ja: "案内" },
] as const;

/** The noren: one indigo bar across the top of every page. */
export function SiteHeader({ name }: { name: string }) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <header className="dark sticky top-0 z-40 border-b border-white/[0.06] bg-ai-950 text-foreground">
      <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-8 px-4 sm:px-6 lg:px-10">
        <Link href="/" aria-label={`${name}, home`} className="min-w-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <BrandMark name={name} />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          {/* The current-page highlight depends on the URL, so it streams in instead of blocking prerendering. */}
          <React.Suspense fallback={<DesktopLinks pathname={null} />}>
            <CurrentPath>{(pathname) => <DesktopLinks pathname={pathname} />}</CurrentPath>
          </React.Suspense>
        </nav>

        <div className="ml-auto flex items-center gap-3 sm:gap-5">
          <OpeningStatus className="hidden lg:inline-flex" />
          <CartButton />
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button type="button" className="grid size-10 place-items-center rounded-full text-foreground outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring md:hidden" aria-label="Open navigation">
                <MenuIcon aria-hidden="true" className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="top" showCloseButton={false} className="dark h-svh gap-0 border-0 bg-ai-950 p-0 text-foreground data-[side=top]:h-svh">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <MobileMenu name={name} onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function CurrentPath({ children }: { children: (pathname: string) => React.ReactNode }) {
  return children(usePathname());
}

function DesktopLinks({ pathname }: { pathname: string | null }) {
  return (
    <ul className="flex items-center gap-1 text-sm">
      {NAV.map((item) => {
        const current = pathname === item.href;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center rounded-full px-4 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                current ? "bg-white/[0.08] text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function MobileMenu({ name, onNavigate }: { name: string; onNavigate: () => void }) {
  const { restaurant } = useCart();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-4">
        <BrandMark name={name} />
        <SheetClose className="grid size-10 place-items-center rounded-full outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close navigation">
          <X aria-hidden="true" className="size-5" />
        </SheetClose>
      </div>
      <nav aria-label="Main" className="flex-1 px-6 pt-8">
        <React.Suspense fallback={<MobileLinks pathname={null} onNavigate={onNavigate} />}>
          <CurrentPath>{(pathname) => <MobileLinks pathname={pathname} onNavigate={onNavigate} />}</CurrentPath>
        </React.Suspense>
      </nav>
      <div className="space-y-4 border-t border-white/10 px-6 py-6 text-sm">
        <OpeningStatus />
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-muted-foreground">
          {hoursSummary(restaurant.openingHours).map((row) => (
            <React.Fragment key={row.days}>
              <dt>{row.days}</dt>
              <dd className="text-right tabular-nums text-foreground">{row.hours}</dd>
            </React.Fragment>
          ))}
        </dl>
      </div>
    </div>
  );
}

function MobileLinks({ pathname, onNavigate }: { pathname: string | null; onNavigate: () => void }) {
  return (
    <ul className="space-y-2">
      {NAV.map((item, index) => (
        <li key={item.href} className="animate-rise" style={{ animationDelay: `${80 + index * 60}ms` }}>
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={pathname === item.href ? "page" : undefined}
            className="group flex items-baseline justify-between gap-4 py-3 outline-none focus-visible:text-hinoki"
          >
            <span className="font-display text-5xl font-bold tracking-tight group-aria-[current=page]:text-hinoki">{item.label}</span>
            <span lang="ja" className="font-display text-lg text-muted-foreground">{item.ja}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
