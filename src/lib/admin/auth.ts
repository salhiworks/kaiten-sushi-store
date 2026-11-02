import "server-only";

import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";

export type AdminSession =
  | { status: "admin"; db: Awaited<ReturnType<typeof createSessionClient>>; userId: string; email: string }
  | { status: "forbidden"; email: string };

/** The signed-in user, verified from their JWT, and whether they are a restaurant admin. */
export async function getAdminSession(): Promise<AdminSession> {
  const db = await createSessionClient();
  const { data } = await db.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/admin/login");
  const email = String(data.claims.email ?? "");
  // RLS only lets a user see their own membership row.
  const { data: member } = await db.from("admin_users").select("user_id").eq("user_id", userId).maybeSingle();
  return member ? { status: "admin", db, userId, email } : { status: "forbidden", email };
}

/** For server actions: the admin's database client, or an error if the caller is not an admin. */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (session.status !== "admin") throw new Error("Only restaurant admins can do this.");
  return session.db;
}
