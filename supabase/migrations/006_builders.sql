-- ============================================================
-- Builders (separate table) — Ahmedabad / Gandhinagar developers
-- Run in Supabase → SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.builders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tier smallint not null default 1
    check (tier in (1, 2, 3)),
  logo_url text,
  cloudinary_public_id text,
  website text,
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint builders_name_unique unique (name)
);

create index if not exists builders_tier_idx on public.builders (tier);
create index if not exists builders_status_idx on public.builders (status);
create index if not exists builders_sort_order_idx on public.builders (sort_order);

drop trigger if exists builders_set_updated_at on public.builders;
create trigger builders_set_updated_at
  before update on public.builders
  for each row
  execute function public.set_updated_at();

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.builders to anon, authenticated;

alter table public.builders enable row level security;

drop policy if exists "Public can read active builders" on public.builders;
drop policy if exists "Authenticated can manage builders" on public.builders;
drop policy if exists "Anon full access builders (DEV ONLY)" on public.builders;

create policy "Public can read active builders"
  on public.builders
  for select
  to anon, authenticated
  using (status = 'active');

create policy "Authenticated can manage builders"
  on public.builders
  for all
  to authenticated
  using (true)
  with check (true);

create policy "Anon full access builders (DEV ONLY)"
  on public.builders
  for all
  to anon
  using (true)
  with check (true);

-- Seed builders (logo_url via Clearbit where domain is known — replace with Cloudinary uploads anytime)
insert into public.builders (name, tier, website, logo_url, status, sort_order) values
  -- Tier 1
  ('Adani Realty', 1, 'https://www.adanirealty.com', '/builders/adani-realty.svg', 'active', 1),
  ('Godrej Properties', 1, 'https://www.godrejproperties.com', '/builders/godrej-properties.svg', 'active', 2),
  ('Shivalik Group', 1, 'https://www.shivalikgroup.com', '/builders/shivalik-group.svg', 'active', 3),
  ('HN Safal', 1, 'https://www.hnsafal.com', '/builders/hn-safal.webp', 'active', 4),
  ('Goyal & Co.', 1, 'https://www.goyalco.com', '/builders/goyal-co.png', 'active', 5),
  ('Ganesh Housing', 1, 'https://www.ganeshhousing.com', '/builders/ganesh-housing.png', 'active', 6),
  ('Bakeri Group', 1, 'https://www.bakeri.com', '/builders/bakeri-group.png', 'active', 7),
  ('Arvind SmartSpaces', 1, 'https://www.arvindsmartspaces.com', '/builders/arvind-smartspaces.png', 'active', 8),
  ('Pacifica Companies', 1, 'https://www.pacificagroup.com', '/builders/pacifica-companies.svg', 'active', 9),
  ('Sun Builders', 1, 'https://www.sunbuilders.in', '/builders/sun-builders.png', 'active', 10),
  -- Tier 2
  ('Venus Infrastructure', 2, 'https://www.venusinfra.com', '/builders/venus-infrastructure.svg', 'active', 11),
  ('Savvy Group', 2, 'https://www.savvygroup.in', '/builders/savvy-group.svg', 'active', 12),
  ('Swati Procon', 2, 'https://www.swatiprocon.com', '/builders/swati-procon.png', 'active', 13),
  ('Sangath IPL', 2, 'https://www.sangath.com', '/builders/sangath-ipl.svg', 'active', 14),
  ('Satyamev Developers', 2, null, '/builders/satyamev-developers.svg', 'active', 15),
  ('Gala Infrastructure', 2, 'https://www.galainfra.com', '/builders/gala-infrastructure.png', 'active', 16),
  ('Shilp Group', 2, 'https://www.shilp.co.in', '/builders/shilp-group.svg', 'active', 17),
  ('Iscon Group', 2, 'https://www.iscongroup.com', '/builders/iscon-group.png', 'active', 18),
  ('Ratna Group', 2, null, '/builders/ratna-group.png', 'active', 19),
  ('Aaryan Group', 2, 'https://www.aaryangroup.com', '/builders/aaryan-group.svg', 'active', 20),
  -- Tier 3
  ('Dev Aashish Group', 3, null, '/builders/dev-aashish-group.svg', 'active', 21),
  ('Saamarth Group', 3, null, '/builders/saamarth-group.svg', 'active', 22),
  ('Sahajanand Group', 3, null, '/builders/sahajanand-group.svg', 'active', 23),
  ('Samved Group', 3, null, '/builders/samved-group.svg', 'active', 24),
  ('Pramukh Group', 3, null, '/builders/pramukh-group.svg', 'active', 25),
  ('Swagat Group', 3, null, '/builders/swagat-group.svg', 'active', 26),
  ('Bansari Projects', 3, null, '/builders/bansari-projects.svg', 'active', 27),
  ('Zion Group', 3, null, '/builders/zion-group.svg', 'active', 28),
  ('Nishant Construction', 3, null, '/builders/nishant-construction.svg', 'active', 29),
  ('Shree Balaji Group', 3, null, '/builders/shree-balaji-group.svg', 'active', 30)
on conflict (name) do nothing;
