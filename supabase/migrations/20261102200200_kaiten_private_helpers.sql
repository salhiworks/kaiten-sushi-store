-- Keep internal helpers out of the public API.
--
-- is_admin() moves to a schema the Data API does not expose, so it can no longer be called as
-- /rest/v1/rpc/is_admin. RLS policies reference functions by identity, so they keep working.
-- restaurant_is_open() is only used inside place_order(), which runs as the owner.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

alter function public.is_admin() set schema private;

revoke execute on function public.restaurant_is_open(public.restaurant_settings, timestamptz) from anon, authenticated;

-- A signed-in user may see their own admin membership (and nothing else). The app uses this to
-- decide whether to show the dashboard; every write is still checked by RLS on the server.
grant select on public.admin_users to authenticated;
create policy "Users see their own admin membership" on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));
