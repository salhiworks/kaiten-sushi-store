import "server-only";

/**
 * KAITEN runs in one of two modes:
 *
 * - "live": menu, settings and orders live in Supabase and guests place real pickup orders.
 *   Requires KAITEN_MODE=live plus the Supabase URL and publishable key.
 * - "demo": the bundled seed menu and no database at all. The belt, menu and cart all work, but
 *   checkout is off, the admin is a 404, and no guest details are ever asked for. This is the
 *   default, so a deployment that forgets its configuration can never take real orders or read a
 *   restaurant's data.
 *
 * next.config.ts fixes KAITEN_MODE into each build, so a demo build stays a demo even if a host
 * later sets KAITEN_MODE=live at runtime.
 */
export const isLive = process.env.KAITEN_MODE === "live";

export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("KAITEN_MODE=live needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }
  return { url, key };
}
