-- Run this once in the Supabase dashboard: SQL Editor → New query → paste
-- this whole file → Run. Creates every table the app needs.
--
-- Security note: this app has no real login system (the "staff password" is
-- a client-side cosmetic deterrent only). These policies grant the public
-- "anon" role full read/write/delete on every table below, because that's
-- what "shared live data, no backend to write" requires. In practice that
-- means anyone who finds your site's API URL (which is public anyway, since
-- it ships in the browser bundle) can read AND modify/delete this data.
-- That's an explicit trade-off, not an oversight — revisit if this ever
-- needs real access control.

create table if not exists ingredients (
  id text primary key,
  name text not null,
  category text not null,
  tags jsonb not null default '[]',
  styles jsonb not null default '[]',
  in_stock boolean not null default true,
  cost_per_serving numeric
);

create table if not exists substitutions (
  id text primary key,
  ingredient_name text not null,
  substitute_name text not null,
  note text
);

create table if not exists venues (
  id text primary key,
  name text not null
);

create table if not exists scans (
  id text primary key,
  venue_id text not null references venues(id) on delete cascade,
  date text not null,
  photo_date text not null,
  photo_urls jsonb not null default '[]'
);

create table if not exists recipes (
  id text primary key,
  name text not null,
  venue_id text references venues(id) on delete cascade,
  scan_id text references scans(id) on delete cascade,
  ingredient_ids jsonb not null default '[]',
  missing_ingredient_names jsonb,
  menu_category text,
  sell_price numeric,
  photo_url text
);

create table if not exists experiments (
  id text primary key,
  name text not null,
  source_recipe_id text,
  tags jsonb not null default '[]',
  ingredient_ids jsonb not null default '[]',
  outcome text not null,
  glass text,
  garnish text not null default '',
  notes text not null default '',
  photo_urls jsonb not null default '[]',
  date text not null,
  promoted_to_menu boolean not null default false
);

create table if not exists lab_queue (
  id text primary key,
  name text not null,
  ingredient_ids jsonb not null default '[]'
);

-- Open access for every table above (see security note up top).
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'ingredients', 'substitutions', 'venues', 'scans', 'recipes', 'experiments', 'lab_queue'
  ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "public full access" on %I', t);
    execute format(
      'create policy "public full access" on %I for all to anon using (true) with check (true)',
      t
    );
  end loop;
end $$;
