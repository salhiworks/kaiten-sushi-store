"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Browser client for the admin, used to upload dish photos straight to Storage under the admin's session. */
export function createBrowserSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
}
