-- KAITEN schema: plate tiers, categories, dishes, restaurant settings, pickup orders and admins.
--
-- Security model
--   * Every table has RLS enabled and explicit grants; Supabase's default "grant all to anon,
--     authenticated" is revoked so nothing is reachable by accident.
--   * Guests can read the public menu and settings, and can only create orders through
--     place_order(), which validates the cart and prices it from the database.
--   * Guests read their own confirmation through get_order(token); the token is an unguessable uuid.
--   * Only users listed in admin_users can change the menu, settings or orders.
--
-- Pricing model
--   A dish has no price of its own: it sits on a plate tier and the tier carries the price. The
--   conveyor legend, menu, cart and order totals therefore always agree.

-- ---------------------------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------------------------

create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------------------------

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create function public.is_admin() returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;

-- ---------------------------------------------------------------------------------------------
-- Menu
-- ---------------------------------------------------------------------------------------------

create table public.plate_tiers (
  id smallint primary key check (id between 1 and 5),
  name text not null check (char_length(name) between 1 and 40),
  color text not null check (color ~ '^#[0-9a-f]{6}$'),
  price_cents integer not null check (price_cents between 1 and 100000),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 40),
  label text not null check (char_length(label) between 1 and 40),
  label_ja text not null default '' check (char_length(label_ja) <= 20),
  description text not null default '' check (char_length(description) <= 200),
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.dishes (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 60),
  name text not null check (char_length(name) between 1 and 80),
  name_ja text not null default '' check (char_length(name_ja) <= 40),
  description text not null default '' check (char_length(description) <= 300),
  category_id text not null references public.categories (id) on update cascade on delete restrict,
  tier_id smallint not null references public.plate_tiers (id),
  -- A storage object path in the dish-images bucket, or a bundled "/dishes/..." path.
  image_path text check (image_path is null or char_length(image_path) <= 300),
  portion text not null default '' check (char_length(portion) <= 40),
  allergens text[] not null default '{}'
    check (allergens <@ array['fish', 'shellfish', 'fish-roe', 'wheat', 'egg', 'soy', 'milk']),
  tags text[] not null default '{}' check (tags <@ array['chefs-pick', 'vegan']),
  -- Sold out today: still listed, cannot be ordered.
  is_available boolean not null default true,
  -- Hidden: not shown to guests at all.
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index dishes_category_id_idx on public.dishes (category_id);
create index dishes_tier_id_idx on public.dishes (tier_id);

-- ---------------------------------------------------------------------------------------------
-- Restaurant settings (a single row)
-- ---------------------------------------------------------------------------------------------

create table public.restaurant_settings (
  id boolean primary key default true check (id),
  name text not null default 'KAITEN' check (char_length(name) between 1 and 40),
  pickup_address text not null default '' check (char_length(pickup_address) <= 200),
  pickup_notes text not null default '' check (char_length(pickup_notes) <= 300),
  phone text not null default '' check (char_length(phone) <= 40),
  timezone text not null default 'America/New_York' check (char_length(timezone) <= 64),
  prep_minutes integer not null default 20 check (prep_minutes between 5 and 240),
  accepting_orders boolean not null default true,
  paused_message text not null default '' check (char_length(paused_message) <= 200),
  -- Seven entries, Monday first: {"closed": bool, "open": "HH:MM", "close": "HH:MM"}.
  opening_hours jsonb not null check (jsonb_typeof(opening_hours) = 'array' and jsonb_array_length(opening_hours) = 7),
  updated_at timestamptz not null default now()
);

create function public.restaurant_is_open(s public.restaurant_settings, at_time timestamptz default now())
returns boolean
language plpgsql
stable
set search_path = ''
as $$
declare
  local_time timestamp := at_time at time zone s.timezone;
  v_day jsonb := s.opening_hours -> (extract(isodow from local_time)::int - 1);
begin
  if v_day is null or coalesce((v_day ->> 'closed')::boolean, false) then
    return false;
  end if;
  return local_time::time >= (v_day ->> 'open')::time and local_time::time < (v_day ->> 'close')::time;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------------------------

create type public.order_status as enum ('new', 'preparing', 'ready', 'collected', 'cancelled');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  -- Capability for the guest's confirmation page. Never shown in the admin.
  public_token uuid not null unique default gen_random_uuid(),
  reference text not null unique,
  status public.order_status not null default 'new',
  customer_name text not null check (char_length(customer_name) between 1 and 80),
  customer_phone text not null check (char_length(customer_phone) between 7 and 30),
  notes text not null default '' check (char_length(notes) <= 500),
  subtotal_cents integer not null check (subtotal_cents > 0),
  total_cents integer not null check (total_cents > 0),
  currency text not null default 'USD',
  payment_method text not null default 'pay_at_pickup' check (payment_method = 'pay_at_pickup'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  -- Snapshot of the dish at the time of ordering; the dish itself may later change or be removed.
  dish_id text references public.dishes (id) on update cascade on delete set null,
  dish_name text not null,
  tier_id smallint not null,
  unit_price_cents integer not null check (unit_price_cents > 0),
  quantity integer not null check (quantity between 1 and 20),
  line_total_cents integer generated always as (unit_price_cents * quantity) stored
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_dish_id_idx on public.order_items (dish_id);

-- ---------------------------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------------------------

create trigger set_updated_at before update on public.plate_tiers for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.dishes for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.restaurant_settings for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.orders for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------------------------
-- Guest ordering
-- ---------------------------------------------------------------------------------------------

-- Creates a pickup order from cart lines [{"dish_id": text, "quantity": int}]. Prices come from
-- the database; p_expected_total_cents is what the guest saw, so a price change is never charged
-- silently. Errors are raised with a stable code as the message (see src/lib/orders).
create function public.place_order(
  p_items jsonb,
  p_customer_name text,
  p_customer_phone text,
  p_notes text,
  p_expected_total_cents integer
)
returns table (order_token uuid, order_reference text, order_total_cents integer)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  s public.restaurant_settings;
  v_name text := btrim(coalesce(p_customer_name, ''));
  v_phone text := btrim(coalesce(p_customer_phone, ''));
  v_notes text := btrim(coalesce(p_notes, ''));
  v_digits text := regexp_replace(btrim(coalesce(p_customer_phone, '')), '\D', '', 'g');
  v_unavailable text;
  v_total integer;
  v_reference text;
  v_order public.orders;
begin
  select * into s from public.restaurant_settings where id;
  if not found or not s.accepting_orders then
    raise exception 'ORDERS_PAUSED';
  end if;
  if not public.restaurant_is_open(s) then
    raise exception 'RESTAURANT_CLOSED';
  end if;

  if char_length(v_name) not between 1 and 80 then
    raise exception 'INVALID_NAME';
  end if;
  if v_phone !~ '^\+?[0-9 ().-]+$' or char_length(v_digits) not between 7 and 15 then
    raise exception 'INVALID_PHONE';
  end if;
  if char_length(v_notes) > 500 then
    raise exception 'INVALID_NOTES';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER';
  end if;
  if jsonb_array_length(p_items) > 50
    or exists (
      select 1
      from jsonb_array_elements(p_items) e
      -- CASE guarantees the numeric cast only runs on numbers.
      where case
        when jsonb_typeof(e) <> 'object' then true
        when jsonb_typeof(e -> 'dish_id') is distinct from 'string' then true
        when jsonb_typeof(e -> 'quantity') is distinct from 'number' then true
        else (e ->> 'quantity')::numeric <> trunc((e ->> 'quantity')::numeric)
          or (e ->> 'quantity')::numeric not between 1 and 20
      end
    )
    or (select count(distinct e ->> 'dish_id') from jsonb_array_elements(p_items) e) <> jsonb_array_length(p_items)
  then
    raise exception 'INVALID_ITEMS';
  end if;

  select string_agg(i.dish_id, ',' order by i.dish_id) into v_unavailable
  from jsonb_to_recordset(p_items) as i (dish_id text, quantity integer)
  left join public.dishes d on d.id = i.dish_id
  where d.id is null or not d.is_visible or not d.is_available;
  if v_unavailable is not null then
    raise exception 'ITEM_UNAVAILABLE' using detail = v_unavailable;
  end if;

  select sum(t.price_cents * i.quantity) into v_total
  from jsonb_to_recordset(p_items) as i (dish_id text, quantity integer)
  join public.dishes d on d.id = i.dish_id
  join public.plate_tiers t on t.id = d.tier_id;
  if p_expected_total_cents is distinct from v_total then
    raise exception 'PRICE_CHANGED' using detail = v_total::text;
  end if;

  -- A light brake on accidental double submits and abuse: five orders per phone per 15 minutes.
  if (
    select count(*) from public.orders o
    where regexp_replace(o.customer_phone, '\D', '', 'g') = v_digits
      and o.created_at > now() - interval '15 minutes'
  ) >= 5 then
    raise exception 'TOO_MANY_ORDERS';
  end if;

  loop
    select 'K-' || string_agg(substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', get_byte(b.bytes, g.n) % 31 + 1, 1), '' order by g.n)
      into v_reference
    from (select extensions.gen_random_bytes(6) as bytes) b, generate_series(0, 5) as g (n);
    exit when not exists (select 1 from public.orders o where o.reference = v_reference);
  end loop;

  insert into public.orders (reference, customer_name, customer_phone, notes, subtotal_cents, total_cents)
  values (v_reference, v_name, v_phone, v_notes, v_total, v_total)
  returning * into v_order;

  insert into public.order_items (order_id, dish_id, dish_name, tier_id, unit_price_cents, quantity)
  select v_order.id, d.id, d.name, t.id, t.price_cents, i.quantity
  from jsonb_to_recordset(p_items) as i (dish_id text, quantity integer)
  join public.dishes d on d.id = i.dish_id
  join public.plate_tiers t on t.id = d.tier_id
  order by d.sort_order, d.name;

  return query select v_order.public_token, v_order.reference, v_order.total_cents;
end;
$$;

-- The guest's confirmation. Returns no phone number and nothing about other orders.
create function public.get_order(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'reference', o.reference,
    'status', o.status,
    'created_at', o.created_at,
    'customer_name', split_part(o.customer_name, ' ', 1),
    'notes', o.notes,
    'total_cents', o.total_cents,
    'currency', o.currency,
    'payment_method', o.payment_method,
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', i.dish_name,
        'quantity', i.quantity,
        'unit_price_cents', i.unit_price_cents,
        'line_total_cents', i.line_total_cents
      ) order by i.id), '[]'::jsonb)
      from public.order_items i
      where i.order_id = o.id
    )
  )
  from public.orders o
  where o.public_token = p_token;
$$;

-- ---------------------------------------------------------------------------------------------
-- Row Level Security and grants
-- ---------------------------------------------------------------------------------------------

alter table public.admin_users enable row level security;
alter table public.plate_tiers enable row level security;
alter table public.categories enable row level security;
alter table public.dishes enable row level security;
alter table public.restaurant_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

-- Public menu
grant select on public.plate_tiers, public.categories, public.dishes, public.restaurant_settings to anon, authenticated;

create policy "Menu tiers are public" on public.plate_tiers for select to anon, authenticated using (true);
create policy "Categories are public" on public.categories for select to anon, authenticated using (true);
create policy "Visible dishes are public" on public.dishes for select to anon, authenticated
  using (is_visible or (select public.is_admin()));
create policy "Restaurant settings are public" on public.restaurant_settings for select to anon, authenticated using (true);

-- Admin writes. Tiers are five fixed slots: they can be edited but not added or removed.
grant update (name, color, price_cents) on public.plate_tiers to authenticated;
grant insert, update, delete on public.categories to authenticated;
grant insert, update, delete on public.dishes to authenticated;
grant update (name, pickup_address, pickup_notes, phone, timezone, prep_minutes, accepting_orders, paused_message, opening_hours)
  on public.restaurant_settings to authenticated;

create policy "Admins edit tiers" on public.plate_tiers for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins add categories" on public.categories for insert to authenticated with check ((select public.is_admin()));
create policy "Admins edit categories" on public.categories for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins remove categories" on public.categories for delete to authenticated using ((select public.is_admin()));
create policy "Admins add dishes" on public.dishes for insert to authenticated with check ((select public.is_admin()));
create policy "Admins edit dishes" on public.dishes for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins remove dishes" on public.dishes for delete to authenticated using ((select public.is_admin()));
create policy "Admins edit settings" on public.restaurant_settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Orders: admins only. Guests never read or write these tables directly. Admins may only change the status.
grant select on public.orders, public.order_items to authenticated;
grant update (status) on public.orders to authenticated;

create policy "Admins read orders" on public.orders for select to authenticated using ((select public.is_admin()));
create policy "Admins update order status" on public.orders for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins read order items" on public.order_items for select to authenticated using ((select public.is_admin()));

-- admin_users has no client grants: membership is managed with the secret key (scripts/create-admin.mjs).

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.restaurant_is_open(public.restaurant_settings, timestamptz) to anon, authenticated;
grant execute on function public.place_order(jsonb, text, text, text, integer) to anon, authenticated;
grant execute on function public.get_order(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Dish photos
-- ---------------------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dish-images', 'dish-images', true, 5242880, array['image/png', 'image/webp', 'image/jpeg', 'image/avif']);

-- Public bucket: anyone can fetch a photo by URL, but only admins can list, upload, replace or delete.
create policy "Admins list dish images" on storage.objects for select to authenticated
  using (bucket_id = 'dish-images' and (select public.is_admin()));
create policy "Admins upload dish images" on storage.objects for insert to authenticated
  with check (bucket_id = 'dish-images' and (select public.is_admin()));
create policy "Admins replace dish images" on storage.objects for update to authenticated
  using (bucket_id = 'dish-images' and (select public.is_admin()))
  with check (bucket_id = 'dish-images' and (select public.is_admin()));
create policy "Admins delete dish images" on storage.objects for delete to authenticated
  using (bucket_id = 'dish-images' and (select public.is_admin()));
