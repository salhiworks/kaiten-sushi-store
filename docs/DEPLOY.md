# Deploying KAITEN (Hostinger or any Node.js host)

KAITEN is a standard Next.js server: it needs a Node.js host, not static hosting. It uses no Vercel-only features, background workers or queues.

## What the host must provide

| Need | Value |
| --- | --- |
| Node.js | 22 or newer (`engines` in `package.json`) |
| Install | `npm ci` (uses the committed `package-lock.json`) |
| Port | the host's `PORT` variable; `next start` uses it |
| Outbound HTTPS | `cdn.21st.dev` for the original dish photos (see [ASSETS.md](ASSETS.md)), and your Supabase project |
| Instances | one. The menu cache lives in the server's memory |

## Choose what you deploy

| | Your store | Public demo |
| --- | --- | --- |
| Build command | `npm run build` | `npm run build:demo` |
| Start command | `npm start` | `npm run start:demo` |
| Environment variables | `KAITEN_MODE=live`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | none |
| What runs | everything: menu from Supabase, pickup ordering, admin | the belt, menu, dish details and plate stack. Ordering off, no admin, no database |

The demo build is locked when it is built:
- It ignores any Supabase settings, even if they are present on the server.
- It asks for no guest details: checkout shows the order and explains that ordering is off.
- `/admin` is a 404.
- It never contacts Supabase.

The store build reads `KAITEN_MODE` when it is built, too, so a build made without `KAITEN_MODE=live` is always a demo.

## Hostinger, step by step

1. Before deploying, finish [step 2 of the README](../README.md#2-make-it-a-real-store-with-supabase-about-15-minutes) so your Supabase project has its tables, menu and admin account.
2. In hPanel, create a **Node.js web app** (on a plan that includes Node.js apps, such as Business or Cloud), not a static website.
3. Connect your GitHub repository, or upload the project without `node_modules`, `.next` and `.env.local`.
4. Choose Node.js **22** (or newer), and set the build and start commands from the table above.
5. Add the environment variables **before the first build**:
   - `KAITEN_MODE` = `live`
   - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = your publishable key

   Their values are built into the site, so any later change needs a rebuild. Never add the secret key, and never commit `.env.local`.
6. Deploy, then connect your domain in hPanel and turn on SSL.
7. Check the live site:
   - The belt turns and the photos load.
   - The header shows your opening status (for example "Taking orders · until 9:30 PM").
   - `/admin` signs in with the account from the README.
   - A test order appears under **Orders**, and moving it to *Preparing* updates the guest's confirmation page.

If the header says "Demo store · ordering off", the build didn't see `KAITEN_MODE=live`: add it and rebuild.

## Vercel (public demo)

The live demo runs on Vercel. Import the repository, keep the Next.js preset, set the **build command** to `npm run build:demo`, and add **no** environment variables. Vercel serves Next.js itself, so no start command is needed.

Don't connect a real Supabase project to a Vercel demo: the demo ignores it anyway. To run your real store on Vercel instead, use the build command `npm run build` with the three store variables. The rest of this guide is written for a single Node.js server.

## Good to know

- **Updates.** Pushing to the connected branch rebuilds the site on most hosts. Menu, price and hours changes made in the admin don't need a rebuild.
- **Time zone.** Opening hours follow the time zone set in **Admin → Restaurant**, not the server's.
- **Logs.** A failed order is logged on the server with the database's reason; guests see a plain-language message.
