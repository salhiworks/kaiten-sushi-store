// Creates (or promotes) a restaurant admin account.
//
//   npm run admin:create -- owner@example.com            # new account, prints a generated password once
//   npm run admin:create -- owner@example.com --reset    # existing account: set a new generated password
//
// Uses SUPABASE_SECRET_KEY from .env.local. Public sign-up is disabled, so this is how admins are added.
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const [email, ...flags] = process.argv.slice(2);
const reset = flags.includes("--reset");
const quiet = flags.includes("--quiet");
const passwordFlag = flags.find((f) => f.startsWith("--password="))?.slice("--password=".length);

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Usage: npm run admin:create -- <email> [--reset] [--password=...]");
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.");
  process.exit(1);
}

const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const password = passwordFlag ?? randomBytes(15).toString("base64url");

async function findUser(address) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === address.toLowerCase());
    if (match || data.users.length < 200) return match ?? null;
  }
  return null;
}

let user = await findUser(email);
let showPassword = false;
if (!user) {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  user = data.user;
  showPassword = true;
} else if (reset || passwordFlag) {
  const { error } = await admin.auth.admin.updateUserById(user.id, { password });
  if (error) throw error;
  showPassword = true;
}

const { error } = await admin.from("admin_users").upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });
if (error) throw error;

console.log(`${email} is a KAITEN admin.`);
if (showPassword && !passwordFlag && !quiet) console.log(`Password (shown only once, keep it in a password manager): ${password}`);
