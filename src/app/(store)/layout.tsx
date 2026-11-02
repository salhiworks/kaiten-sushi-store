import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartProvider } from "@/components/cart/cart-provider";
import { MobileOrderBar } from "@/components/cart/mobile-order-bar";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { isLive } from "@/lib/config";
import { getMenu, getRestaurant } from "@/lib/menu/server";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [{ dishes }, restaurant] = await Promise.all([getMenu(), getRestaurant()]);
  return (
    <CartProvider dishes={dishes} restaurant={restaurant} demo={!isLive}>
      <a href="#main" className="sr-only z-50 rounded-full bg-foreground px-4 py-2 text-sm text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-3">
        Skip to content
      </a>
      <SiteHeader name={restaurant.name} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter restaurant={restaurant} />
      <MobileOrderBar />
      <CartDrawer />
    </CartProvider>
  );
}
