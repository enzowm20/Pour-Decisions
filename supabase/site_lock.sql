-- Run once in the Supabase SQL Editor. A single shared row that every
-- visitor reads/writes — this is what makes "lock the site" affect
-- EVERYONE viewing it, not just the browser that pressed the padlock.
create table if not exists site_lock (
  id text primary key default 'global',
  locked boolean not null default false
);

insert into site_lock (id, locked) values ('global', false)
on conflict (id) do nothing;

alter table site_lock enable row level security;
drop policy if exists "public full access" on site_lock;
create policy "public full access" on site_lock for all to anon using (true) with check (true);
