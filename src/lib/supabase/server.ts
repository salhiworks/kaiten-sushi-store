import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { supabaseEnv } from "@/lib/config";

/**
 * Anonymous client with no cookies. Safe inside "use cache" and for guest operations: it can only
 * read the public menu and call place_order / get_order.
 */
export function createPublicClient() {
  const { url, key } = supabaseEnv();
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Client acting as the signed-in user (the restaurant admin). Every query is subject to RLS. */
export async function createSessionClient() {
  // Supabase auth reads the clock as soon as a client is created. Marking this as request-time work keeps
  // prerendered shells and prefetches from waiting on it.
  await connection();
  const { url, key } = supabaseEnv();
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component, where cookies are read-only. The proxy refreshes sessions.
        }
      },
    },
  });
}
