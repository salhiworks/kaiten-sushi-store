import type { Metadata, Viewport } from "next";
import { Geist_Mono, Shippori_Mincho_B1, Zen_Kaku_Gothic_New } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { getMenu, getRestaurant } from "@/lib/menu/server";
import "./globals.css";

// Both Japanese families ship their glyphs as many unicode-range slices. Preloading would fetch all
// of them; without it the browser downloads only the slices a page actually uses.
const zenKaku = Zen_Kaku_Gothic_New({ variable: "--font-zen-kaku", subsets: ["latin"], weight: ["400", "500", "700"], preload: false });
const shippori = Shippori_Mincho_B1({ variable: "--font-shippori", subsets: ["latin"], weight: ["500", "700", "800"], preload: false });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const { name } = await getRestaurant();
  return {
    title: { default: `${name} · Conveyor sushi`, template: `%s · ${name}` },
    description: "A conveyor-belt sushi counter on the web. Watch the belt, lift a plate and order for pickup.",
  };
}

export const viewport: Viewport = {
  themeColor: "#172139",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { tiers } = await getMenu();
  // Plate colours are data: the conveyor, menu, cart and admin all draw rings with --chart-1…5.
  // Colours are validated as #rrggbb by the database before they get here.
  const plateColors = `:root{${tiers.map((tier) => `--chart-${tier.id}:${tier.color};`).join("")}}`;
  return (
    <html lang="en" className={`${zenKaku.variable} ${shippori.variable} ${geistMono.variable} antialiased`}>
      <head>
        <style>{plateColors}</style>
      </head>
      <body className="flex min-h-svh flex-col overflow-x-clip">
        {children}
        <Toaster theme="light" position="bottom-center" mobileOffset={{ bottom: 96 }} />
      </body>
    </html>
  );
}
