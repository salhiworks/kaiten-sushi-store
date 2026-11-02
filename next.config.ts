import path from "node:path";
import type { NextConfig } from "next";
import { DISH_PHOTO_SOURCES } from "./src/lib/menu/photo-sources";

// "live" only when asked for. Anything else is the demo, and the choice is fixed into the build (see src/lib/config.ts).
const mode = process.env.KAITEN_MODE === "live" ? "live" : "demo";
const supabaseHost = mode === "live" && process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;

const nextConfig: NextConfig = {
  // Lets a second build (for example the demo) sit next to the main one locally: NEXT_DIST_DIR=.next-demo.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  env: { KAITEN_MODE: mode },
  images: {
    // Dish photos uploaded from the admin are served from Supabase Storage.
    remotePatterns: supabaseHost ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/dish-images/**" }] : [],
  },
  /*
   * The original dish photos are served from this site's /dishes/<id>.webp, proxied to their source (src/lib/menu/photo-sources.ts).
   * These are "afterFiles" rewrites, so a real file in public/dishes/ with the same name always wins over the proxy.
   */
  async rewrites() {
    return Object.entries(DISH_PHOTO_SOURCES).map(([id, url]) => ({ source: `/dishes/${id}.webp`, destination: url }));
  },
  turbopack: {
    // Pin the root so a stray lockfile higher up the tree is never picked as the workspace root.
    root: path.join(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
