# Supabase with the command line

The README's step 2 sets up Supabase in the dashboard's SQL Editor. This page does the same three files with the Supabase CLI instead. Use one way per project, not both.

The CLI is pinned in `package.json` (`supabase` 2.122.0), so run `npm install` first and always call it as `npx supabase`, never a global `supabase`. Version 3 changed these commands, so check that `npx supabase --version` prints `2.122.0`. A hosted project needs no Docker and no local database.

## With Claude Desktop

Open this folder in Claude Desktop's Code tab and ask it to follow this page. It can run every command below for you, and you stay in control:
- Run `npx supabase login` yourself in a terminal: it opens your browser, and you approve it there.
- Give it your Project ID (**Project Settings → General**), never your database password.
- It should show you the output of `migration list` and `db push --dry-run` before it runs `db push`.
- Tell it never to use `--reveal`, `supabase db reset` or `supabase migration repair`.

You can also type the commands yourself.

## Apply the migrations

1. `npx supabase login` opens your browser once.
2. `npx supabase link --project-ref <project-id>` links this folder to your project. Your Project ID is in **Project Settings → General**.
3. `npx supabase migration list --linked` shows the project's migration history. A new project has none.
   - If it lists versions that aren't in `supabase/migrations`, stop: this project was set up some other way.
   - If the history is empty but the tables already exist (`public.dishes`, for example), the files were already run in the SQL Editor. The project is set up: don't push. The files aren't safe to run twice.
4. `npx supabase db push --linked --dry-run` shows what would be applied. It should list exactly these, in this order:
   1. `20261102200000_kaiten_schema.sql`
   2. `20261102200100_kaiten_seed.sql`
   3. `20261102200200_kaiten_private_helpers.sql`
5. `npx supabase db push --linked` applies them and records them in the project's migration history. Running it again says the database is up to date.

The starting menu (five plate colours, four categories, eight dishes and opening hours) is the second migration, so there is no separate seed step. Never add `--include-seed`, and never run `supabase db reset` or `supabase migration repair` on a hosted project.

## Check the result

`npx supabase db query --linked "<sql>"` runs a query on your project. After the push you should have:
- Row Level Security on all seven tables in `public`
- a public Storage bucket called `dish-images`
- 5 plate tiers, 4 categories and 8 dishes

## Your admin account

Create the user in the dashboard (README step 2.5: **Authentication → Users → Add user → Create new user**, with **Auto Confirm User** ticked), then add it to the admin list:

```bash
npx supabase db query --linked "insert into public.admin_users (user_id) select id from auth.users where email = 'you@example.com';"
```

Turn off **Allow new users to sign up** in **Authentication → Sign In / Providers**, as in the README.

## Your keys

`npx supabase projects api-keys --project-ref <project-id>` lists the project's keys. The store needs only the **publishable** key (`sb_publishable_…`) and the Project URL, `https://<project-id>.supabase.co`. Never use `--reveal`: it prints the secret keys, which the store never needs. You can also copy both values from **Connect** in the dashboard.
