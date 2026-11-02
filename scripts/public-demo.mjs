// Builds or serves the public demo: the belt, the menu, the cart and the plate stack, with ordering off and no admin.
//   npm run build:demo   then   npm run start:demo   (extra arguments go to Next.js, e.g. npm run start:demo -- -p 4000)
//
// Every Supabase setting is set to empty for Next.js, so values from .env.local (or the host) can't reach the build, and
// KAITEN_MODE is set to "demo", which next.config.ts then fixes into the build. Plain Node, so it works the same on every OS.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const [command, ...rest] = process.argv.slice(2);
if (command !== "build" && command !== "start") {
  console.error("Usage: node scripts/public-demo.mjs build|start [next options]");
  process.exit(1);
}

const BLANKED = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"];
const env = { ...process.env, KAITEN_MODE: "demo" };
for (const name of BLANKED) env[name] = ""; // defined but empty: Next.js then never loads it from an .env file

const next = createRequire(import.meta.url).resolve("next/dist/bin/next");
const child = spawn(process.execPath, [next, command, ...rest], { env, stdio: "inherit" });
child.on("exit", (code, signal) => (signal ? process.kill(process.pid, signal) : process.exit(code ?? 1)));
