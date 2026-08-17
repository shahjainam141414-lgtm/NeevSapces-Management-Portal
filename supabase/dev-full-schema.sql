-- ============================================================
-- NeevSpaces-Dev — full schema (migrations 001 → 027)
-- Run once in: Supabase → NeevSpaces-Dev → SQL Editor
-- Project: https://tmllhtnfkntcpltmiwua.supabase.co
-- ============================================================


-- ------------------------------------------------------------
-- 001_static_options.sql
-- ------------------------------------------------------------
-- ============================================================
-- Neev Admin â€” Static Options (lookup / master data)
-- Run this in Supabase â†’ SQL Editor â†’ New query â†’ Run
-- ============================================================
-- One table for ALL customization lists:
--   areas, projects, builders, amenities, property_types, categories
-- Each row is distinguished by `type`.
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.static_options (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  value text not null,
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Same value cannot repeat inside the same type
  constraint static_options_type_value_unique unique (type, value)
);

-- Allowed type values (extend later if needed)
alter table public.static_options
  drop constraint if exists static_options_type_check;

alter table public.static_options
  add constraint static_options_type_check
  check (
    type in (
      'area',
      'project',
      'builder',
      'amenity',
      'property_type',
      'category'
    )
  );

create index if not exists static_options_type_idx
  on public.static_options (type);

create index if not exists static_options_type_status_idx
  on public.static_options (type, status);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists static_options_set_updated_at on public.static_options;
create trigger static_options_set_updated_at
  before update on public.static_options
  for each row
  execute function public.set_updated_at();

-- ============================================================
-- API privileges (required â€” without these you get 401 / 42501)
-- ============================================================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.static_options to anon, authenticated;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.static_options enable row level security;

-- Drop old policies if re-running
drop policy if exists "Public can read active options" on public.static_options;
drop policy if exists "Authenticated can read all options" on public.static_options;
drop policy if exists "Authenticated can insert options" on public.static_options;
drop policy if exists "Authenticated can update options" on public.static_options;
drop policy if exists "Authenticated can delete options" on public.static_options;
drop policy if exists "Anon full access (DEV ONLY)" on public.static_options;

-- Website / public: only active rows (safe to expose)
create policy "Public can read active options"
  on public.static_options
  for select
  to anon, authenticated
  using (status = 'active');

-- Admin (logged-in): read everything including inactive
create policy "Authenticated can read all options"
  on public.static_options
  for select
  to authenticated
  using (true);

create policy "Authenticated can insert options"
  on public.static_options
  for insert
  to authenticated
  with check (true);

create policy "Authenticated can update options"
  on public.static_options
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete options"
  on public.static_options
  for delete
  to authenticated
  using (true);

-- ============================================================
-- DEV ONLY â€” remove this policy once Supabase Auth is wired
-- Needed so the admin panel can CRUD with the anon key today
-- ============================================================
create policy "Anon full access (DEV ONLY)"
  on public.static_options
  for all
  to anon
  using (true)
  with check (true);

-- ============================================================
-- Seed sample property types (optional)
-- ============================================================
insert into public.static_options (type, value, status) values
  ('property_type', '2 BHK Apartment', 'active'),
  ('property_type', '3 BHK Apartment', 'active'),
  ('property_type', '4 BHK Penthouse', 'active'),
  ('property_type', 'Villa', 'active')
on conflict (type, value) do nothing;



-- ------------------------------------------------------------
-- 002_fix_static_options_grants.sql
-- ------------------------------------------------------------
-- ============================================================
-- FIX: permission_denied for table static_options (401 / 42501)
-- Run this NOW in Supabase â†’ SQL Editor â†’ Run
-- ============================================================
-- Your table exists and has data. The API role `anon` is missing
-- table GRANTs + RLS policies (Table Editor shows "0 RLS policies").
-- ============================================================

-- 1) Table privileges for API roles
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.static_options to anon, authenticated;

-- If you ever add sequences later:
-- grant usage, select on all sequences in schema public to anon, authenticated;

-- 2) Enable RLS
alter table public.static_options enable row level security;

-- 3) Recreate policies (safe to re-run)
drop policy if exists "Public can read active options" on public.static_options;
drop policy if exists "Authenticated can read all options" on public.static_options;
drop policy if exists "Authenticated can insert options" on public.static_options;
drop policy if exists "Authenticated can update options" on public.static_options;
drop policy if exists "Authenticated can delete options" on public.static_options;
drop policy if exists "Anon full access (DEV ONLY)" on public.static_options;

create policy "Public can read active options"
  on public.static_options
  for select
  to anon, authenticated
  using (status = 'active');

create policy "Authenticated can read all options"
  on public.static_options
  for select
  to authenticated
  using (true);

create policy "Authenticated can insert options"
  on public.static_options
  for insert
  to authenticated
  with check (true);

create policy "Authenticated can update options"
  on public.static_options
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete options"
  on public.static_options
  for delete
  to authenticated
  using (true);

-- DEV: allow admin panel CRUD with anon key until Auth is wired
create policy "Anon full access (DEV ONLY)"
  on public.static_options
  for all
  to anon
  using (true)
  with check (true);

-- 4) Quick verify (should return your 4 property types)
select id, type, value, status from public.static_options order by value;



-- ------------------------------------------------------------
-- 003_seed_areas.sql
-- ------------------------------------------------------------
-- Optional seed for Areas (same static_options table, type = 'area')
-- Run in Supabase â†’ SQL Editor if you want starter rows

insert into public.static_options (type, value, status) values
  ('area', 'SG Highway', 'active'),
  ('area', 'Science City', 'active'),
  ('area', 'Sindhu Bhavan', 'active'),
  ('area', 'Bopal', 'inactive')
on conflict (type, value) do nothing;



-- ------------------------------------------------------------
-- 004_site_banners.sql
-- ------------------------------------------------------------
-- ============================================================
-- Main Banner â€” store Cloudinary image URL for website hero
-- Run in Supabase â†’ SQL Editor
-- ============================================================

create table if not exists public.site_banners (
  id uuid primary key default gen_random_uuid(),
  slot text not null unique default 'main',
  image_url text not null,
  cloudinary_public_id text,
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_banners_slot_check check (slot in ('main'))
);

create index if not exists site_banners_slot_idx on public.site_banners (slot);

-- Ensure updated_at helper exists (also in 001_static_options.sql)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_banners_set_updated_at on public.site_banners;
create trigger site_banners_set_updated_at
  before update on public.site_banners
  for each row
  execute function public.set_updated_at();

-- Privileges
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.site_banners to anon, authenticated;

alter table public.site_banners enable row level security;

drop policy if exists "Public can read active banners" on public.site_banners;
drop policy if exists "Authenticated can manage banners" on public.site_banners;
drop policy if exists "Anon full access banners (DEV ONLY)" on public.site_banners;

create policy "Public can read active banners"
  on public.site_banners
  for select
  to anon, authenticated
  using (status = 'active');

create policy "Authenticated can manage banners"
  on public.site_banners
  for all
  to authenticated
  using (true)
  with check (true);

-- DEV ONLY until Auth is wired
create policy "Anon full access banners (DEV ONLY)"
  on public.site_banners
  for all
  to anon
  using (true)
  with check (true);



-- ------------------------------------------------------------
-- 005_amenities.sql
-- ------------------------------------------------------------
-- ============================================================
-- Amenities (separate from static_options)
-- Run in Supabase â†’ SQL Editor
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

create table if not exists public.amenities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  icon_url text,
  cloudinary_public_id text,
  icon_key text,
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint amenities_title_unique unique (title)
);

create index if not exists amenities_status_idx on public.amenities (status);
create index if not exists amenities_sort_order_idx on public.amenities (sort_order);

drop trigger if exists amenities_set_updated_at on public.amenities;
create trigger amenities_set_updated_at
  before update on public.amenities
  for each row
  execute function public.set_updated_at();

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.amenities to anon, authenticated;

alter table public.amenities enable row level security;

drop policy if exists "Public can read active amenities" on public.amenities;
drop policy if exists "Authenticated can manage amenities" on public.amenities;
drop policy if exists "Anon full access amenities (DEV ONLY)" on public.amenities;

create policy "Public can read active amenities"
  on public.amenities
  for select
  to anon, authenticated
  using (status = 'active');

create policy "Authenticated can manage amenities"
  on public.amenities
  for all
  to authenticated
  using (true)
  with check (true);

-- DEV ONLY until Auth is wired
create policy "Anon full access amenities (DEV ONLY)"
  on public.amenities
  for all
  to anon
  using (true)
  with check (true);

-- Seed amenity list (icon_key = Lucide fallback until custom icon uploaded)
insert into public.amenities (title, icon_key, status, sort_order) values
  ('Security Cabin', 'shield', 'active', 1),
  ('Swimming Pool', 'waves', 'active', 2),
  ('Children''s Play Area', 'toy-brick', 'active', 3),
  ('Common Toilet', 'bath', 'active', 4),
  ('Indoor Game', 'gamepad-2', 'active', 5),
  ('Library', 'book-open', 'active', 6),
  ('Multi-Purpose Court', 'circle-dot', 'active', 7),
  ('Power Backup', 'zap', 'active', 8),
  ('Multipurpose Hall', 'building-2', 'active', 9),
  ('Walking Track', 'footprints', 'active', 10),
  ('Waterbody', 'droplets', 'active', 11),
  ('Home Theater', 'clapperboard', 'active', 12),
  ('Lily Pond', 'flower-2', 'active', 13),
  ('Elegant Entrance', 'door-open', 'active', 14),
  ('Sitting Gazebo', 'home', 'active', 15),
  ('Open Yoga Area', 'heart-pulse', 'active', 16),
  ('Dense Landscape', 'trees', 'active', 17),
  ('Lawn Area With Sit-out', 'leaf', 'active', 18),
  ('Sunken Seating', 'sofa', 'active', 19),
  ('Attractive Sculpture', 'landmark', 'active', 20),
  ('Swing Area', 'sparkles', 'active', 21),
  ('Pool Side Seating Deck', 'umbrella', 'active', 22),
  ('Potted Plants', 'sprout', 'active', 23),
  ('Roof Top Seating', 'building', 'active', 24),
  ('Baby Pool', 'baby', 'active', 25),
  ('Indoor Gym', 'dumbbell', 'active', 26),
  ('Toddler Room', 'baby', 'active', 27),
  ('Net Seating', 'stretch-horizontal', 'active', 28),
  ('Manager Cabin', 'briefcase', 'active', 29),
  ('Attractive Street Light', 'lamp', 'active', 30),
  ('Store Room', 'package', 'active', 31),
  ('Meter Room', 'gauge', 'active', 32),
  ('Two Level Parking', 'car', 'active', 33),
  ('Temple', 'church', 'active', 34)
on conflict (title) do nothing;



-- ------------------------------------------------------------
-- 006_builders.sql
-- ------------------------------------------------------------
-- ============================================================
-- Builders (separate table) â€” Ahmedabad / Gandhinagar developers
-- Run in Supabase â†’ SQL Editor
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

-- Seed builders (logo_url via Clearbit where domain is known â€” replace with Cloudinary uploads anytime)
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



-- ------------------------------------------------------------
-- 007_builders_local_logos.sql
-- ------------------------------------------------------------
-- Point builders to local logos (Clearbit URLs often fail)
-- Safe to re-run

update public.builders set logo_url = '/builders/adani-realty.svg' where name = 'Adani Realty';
update public.builders set logo_url = '/builders/godrej-properties.svg' where name = 'Godrej Properties';
update public.builders set logo_url = '/builders/shivalik-group.svg' where name = 'Shivalik Group';
update public.builders set logo_url = '/builders/hn-safal.webp' where name = 'HN Safal';
update public.builders set logo_url = '/builders/goyal-co.png' where name = 'Goyal & Co.';
update public.builders set logo_url = '/builders/ganesh-housing.png' where name = 'Ganesh Housing';
update public.builders set logo_url = '/builders/bakeri-group.png' where name = 'Bakeri Group';
update public.builders set logo_url = '/builders/arvind-smartspaces.png' where name = 'Arvind SmartSpaces';
update public.builders set logo_url = '/builders/pacifica-companies.svg' where name = 'Pacifica Companies';
update public.builders set logo_url = '/builders/sun-builders.png' where name = 'Sun Builders';
update public.builders set logo_url = '/builders/venus-infrastructure.svg' where name = 'Venus Infrastructure';
update public.builders set logo_url = '/builders/savvy-group.svg' where name = 'Savvy Group';
update public.builders set logo_url = '/builders/swati-procon.png' where name = 'Swati Procon';
update public.builders set logo_url = '/builders/sangath-ipl.svg' where name = 'Sangath IPL';
update public.builders set logo_url = '/builders/satyamev-developers.svg' where name = 'Satyamev Developers';
update public.builders set logo_url = '/builders/gala-infrastructure.png' where name = 'Gala Infrastructure';
update public.builders set logo_url = '/builders/shilp-group.svg' where name = 'Shilp Group';
update public.builders set logo_url = '/builders/iscon-group.png' where name = 'Iscon Group';
update public.builders set logo_url = '/builders/ratna-group.png' where name = 'Ratna Group';
update public.builders set logo_url = '/builders/aaryan-group.svg' where name = 'Aaryan Group';
update public.builders set logo_url = '/builders/dev-aashish-group.svg' where name = 'Dev Aashish Group';
update public.builders set logo_url = '/builders/saamarth-group.svg' where name = 'Saamarth Group';
update public.builders set logo_url = '/builders/sahajanand-group.svg' where name = 'Sahajanand Group';
update public.builders set logo_url = '/builders/samved-group.svg' where name = 'Samved Group';
update public.builders set logo_url = '/builders/pramukh-group.svg' where name = 'Pramukh Group';
update public.builders set logo_url = '/builders/swagat-group.svg' where name = 'Swagat Group';
update public.builders set logo_url = '/builders/bansari-projects.svg' where name = 'Bansari Projects';
update public.builders set logo_url = '/builders/zion-group.svg' where name = 'Zion Group';
update public.builders set logo_url = '/builders/nishant-construction.svg' where name = 'Nishant Construction';
update public.builders set logo_url = '/builders/shree-balaji-group.svg' where name = 'Shree Balaji Group';



-- ------------------------------------------------------------
-- 008_builders_cloudinary_note.sql
-- ------------------------------------------------------------
-- Example: after uploading logos to Cloudinary in the admin UI,
-- builders.logo_url and builders.cloudinary_public_id are updated automatically.
--
-- Godrej + Shivalik were uploaded as the reference originals:
-- logo_url = https://res.cloudinary.com/ywqiqhfa/image/upload/.../neev/builders/...
--
-- For every other builder: open Edit â†’ upload original logo â†’ Save.



-- ------------------------------------------------------------
-- 009_admin_auth.sql
-- ------------------------------------------------------------
-- ============================================================
-- Admin Auth â€” profiles linked to auth.users
-- Run in Supabase â†’ SQL Editor
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

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  photo_url text,
  role text not null default 'Super Admin'
    check (role = 'Super Admin'),
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_profiles_email_unique unique (email)
);

create index if not exists admin_profiles_email_idx on public.admin_profiles (email);
create index if not exists admin_profiles_status_idx on public.admin_profiles (status);

drop trigger if exists admin_profiles_set_updated_at on public.admin_profiles;
create trigger admin_profiles_set_updated_at
  before update on public.admin_profiles
  for each row
  execute function public.set_updated_at();

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.admin_profiles to authenticated;
grant select on table public.admin_profiles to anon;

alter table public.admin_profiles enable row level security;

drop policy if exists "Authenticated can read admin profiles" on public.admin_profiles;
drop policy if exists "Users can update own profile" on public.admin_profiles;
drop policy if exists "Service role full access profiles" on public.admin_profiles;
drop policy if exists "Anon full access profiles (DEV ONLY)" on public.admin_profiles;

create policy "Authenticated can read admin profiles"
  on public.admin_profiles
  for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.admin_profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Allow authenticated inserts (invite flow also uses service role)
create policy "Authenticated can insert profiles"
  on public.admin_profiles
  for insert
  to authenticated
  with check (true);

create policy "Authenticated can delete profiles"
  on public.admin_profiles
  for delete
  to authenticated
  using (true);

-- DEV: anon access so service-less local testing still works if needed
-- Prefer service role for invites; remove this in production if desired
create policy "Anon full access profiles (DEV ONLY)"
  on public.admin_profiles
  for all
  to anon
  using (true)
  with check (true);



-- ------------------------------------------------------------
-- 010_fix_admin_profiles_grants.sql
-- ------------------------------------------------------------
-- ============================================================
-- Fix grants on admin_profiles (fixes "permission denied")
-- Run in Supabase â†’ SQL Editor
-- ============================================================

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table public.admin_profiles to authenticated;
grant select, insert, update, delete on table public.admin_profiles to anon;
grant all on table public.admin_profiles to service_role;
grant all on table public.admin_profiles to postgres;

-- Optional: seed YOUR first Super Admin after you Google/email login once.
-- Replace the placeholders, then re-run only this block:
--
-- insert into public.admin_profiles (id, name, email, role, status)
-- select id,
--        coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
--        email,
--        'Super Admin',
--        'active'
-- from auth.users
-- where email = 'YOUR_EMAIL@example.com'
-- on conflict (id) do update
--   set name = excluded.name,
--       email = excluded.email,
--       status = 'active',
--       updated_at = now();



-- ------------------------------------------------------------
-- 011_admin_allowlist_bootstrap.sql
-- ------------------------------------------------------------
-- ============================================================
-- Admin allowlist helpers
-- Run in Supabase â†’ SQL Editor
-- ============================================================

-- 1) Ensure grants (safe to re-run)
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on table public.admin_profiles to authenticated;
grant select, insert, update, delete on table public.admin_profiles to anon;
grant all on table public.admin_profiles to service_role;
grant all on table public.admin_profiles to postgres;

-- 2) Bootstrap YOUR Super Admin(s) from existing Google logins
--    ONLY emails listed here can use the admin panel.
--    Replace / add emails as needed, then run this block.

insert into public.admin_profiles (id, name, email, role, status)
select
  u.id,
  coalesce(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ),
  lower(u.email),
  'Super Admin',
  'active'
from auth.users u
where lower(u.email) in (
  lower('shahjainam141414@gmail.com')
  -- , lower('another@email.com')
)
on conflict (id) do update
  set
    name = excluded.name,
    email = excluded.email,
    status = 'active',
    updated_at = now();

-- 3) Optional cleanup: remove Auth users who are NOT allowlisted
--    (keeps auth.users clean â€” only invited/allowlisted admins remain)
-- WARNING: this deletes Google accounts that were never added via Add User.
-- Uncomment when ready:
--
-- delete from auth.users u
-- where not exists (
--   select 1 from public.admin_profiles p where p.id = u.id
-- );



-- ------------------------------------------------------------
-- 012_amenities_is_default.sql
-- ------------------------------------------------------------
-- ============================================================
-- Amenities â€” is_default (Yes / No)
-- Run in Supabase â†’ SQL Editor
-- ============================================================

alter table public.amenities
  add column if not exists is_default boolean not null default false;

create index if not exists amenities_is_default_idx
  on public.amenities (is_default);

comment on column public.amenities.is_default is
  'When true, amenity is treated as a default selection for listings.';



-- ------------------------------------------------------------
-- 013_properties.sql
-- ------------------------------------------------------------
-- ============================================================
-- Properties â€” full project listings (Privilon-style detail)
-- Run in Supabase â†’ SQL Editor
-- Depends on: static_options (areas), builders, amenities
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

create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(
    lower(coalesce(input, '')),
    '[^a-z0-9]+',
    '-',
    'g'
  ));
$$;

-- ------------------------------------------------------------
-- Main property / project listing
-- ------------------------------------------------------------
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),

  -- Identity
  title text not null,
  slug text not null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'inactive')),
  is_featured boolean not null default false,
  is_hero_banner boolean not null default false,
  listing_badge text not null default 'For Sale',

  -- Location (area selected first in admin)
  area_id uuid references public.static_options (id) on delete set null,
  area_name text,
  locality text,
  city text not null default 'Gandhinagar',
  pincode text,
  full_address text,

  -- Media
  cover_image_url text,
  cover_cloudinary_public_id text,
  hero_banner_url text,
  hero_banner_cloudinary_public_id text,
  brochure_url text,

  -- Pricing (rate card)
  package_price_label text,
  package_price_notes text,
  price_per_sqft_label text,

  -- Quick "Details" strip
  availability text[] not null default '{}',
  possession_by text,
  property_type_label text,
  tower_count int,
  unit_count int,
  rera_no text,
  rera_url text,

  -- Developer / category
  builder_id uuid references public.builders (id) on delete set null,
  developer_name text,
  category_label text,
  construction_status text,

  -- Project meta
  project_size_label text,
  floor_count int,
  total_plot_area text,
  open_area_percent numeric(5, 2),
  parking_types text[] not null default '{}',
  facing text,
  project_position text,
  road_connectivity text,
  current_status text default 'Available',

  -- Long-form
  about text,

  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint properties_slug_unique unique (slug),
  constraint properties_title_check check (char_length(trim(title)) > 0)
);

create index if not exists properties_area_id_idx on public.properties (area_id);
create index if not exists properties_builder_id_idx on public.properties (builder_id);
create index if not exists properties_status_idx on public.properties (status);
create index if not exists properties_slug_idx on public.properties (slug);
create index if not exists properties_sort_order_idx on public.properties (sort_order);
create index if not exists properties_is_hero_banner_idx
  on public.properties (is_hero_banner)
  where is_hero_banner = true;

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
  before update on public.properties
  for each row
  execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Gallery photos
-- ------------------------------------------------------------
create table if not exists public.property_media (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  image_url text not null,
  cloudinary_public_id text,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists property_media_property_id_idx
  on public.property_media (property_id);

drop trigger if exists property_media_set_updated_at on public.property_media;
create trigger property_media_set_updated_at
  before update on public.property_media
  for each row
  execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Floor plans + unit configs (3 BHK Type 1, etc.)
-- ------------------------------------------------------------
create table if not exists public.property_floor_plans (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  name text not null,
  bhk_label text,
  rooms int,
  balcony int,
  bathroom int,
  servant_room int,
  area_sqft numeric(12, 2),
  area_sqyd numeric(12, 2),
  area_sqmt numeric(12, 2),
  price_label text,
  image_url text,
  cloudinary_public_id text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists property_floor_plans_property_id_idx
  on public.property_floor_plans (property_id);

drop trigger if exists property_floor_plans_set_updated_at on public.property_floor_plans;
create trigger property_floor_plans_set_updated_at
  before update on public.property_floor_plans
  for each row
  execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Amenities junction
-- ------------------------------------------------------------
create table if not exists public.property_amenities (
  property_id uuid not null references public.properties (id) on delete cascade,
  amenity_id uuid not null references public.amenities (id) on delete cascade,
  sort_order int not null default 0,
  primary key (property_id, amenity_id)
);

create index if not exists property_amenities_amenity_id_idx
  on public.property_amenities (amenity_id);

-- ------------------------------------------------------------
-- "Why this project" highlights
-- ------------------------------------------------------------
create table if not exists public.property_highlights (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  content text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists property_highlights_property_id_idx
  on public.property_highlights (property_id);

-- ------------------------------------------------------------
-- Specifications
-- ------------------------------------------------------------
create table if not exists public.property_specs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  content text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists property_specs_property_id_idx
  on public.property_specs (property_id);

-- ------------------------------------------------------------
-- FAQs
-- ------------------------------------------------------------
create table if not exists public.property_faqs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists property_faqs_property_id_idx
  on public.property_faqs (property_id);

drop trigger if exists property_faqs_set_updated_at on public.property_faqs;
create trigger property_faqs_set_updated_at
  before update on public.property_faqs
  for each row
  execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Grants + RLS (match existing admin pattern)
-- ------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table public.properties to anon, authenticated;
grant select, insert, update, delete on table public.property_media to anon, authenticated;
grant select, insert, update, delete on table public.property_floor_plans to anon, authenticated;
grant select, insert, update, delete on table public.property_amenities to anon, authenticated;
grant select, insert, update, delete on table public.property_highlights to anon, authenticated;
grant select, insert, update, delete on table public.property_specs to anon, authenticated;
grant select, insert, update, delete on table public.property_faqs to anon, authenticated;

alter table public.properties enable row level security;
alter table public.property_media enable row level security;
alter table public.property_floor_plans enable row level security;
alter table public.property_amenities enable row level security;
alter table public.property_highlights enable row level security;
alter table public.property_specs enable row level security;
alter table public.property_faqs enable row level security;

-- properties
drop policy if exists "Public can read active properties" on public.properties;
drop policy if exists "Authenticated can manage properties" on public.properties;
drop policy if exists "Anon full access properties (DEV ONLY)" on public.properties;

create policy "Public can read active properties"
  on public.properties for select to anon, authenticated
  using (status = 'active');

create policy "Authenticated can manage properties"
  on public.properties for all to authenticated
  using (true) with check (true);

create policy "Anon full access properties (DEV ONLY)"
  on public.properties for all to anon
  using (true) with check (true);

-- helper for child tables: allow if parent is active OR authenticated/anon manage
drop policy if exists "Public can read media of active properties" on public.property_media;
drop policy if exists "Authenticated can manage property_media" on public.property_media;
drop policy if exists "Anon full access property_media (DEV ONLY)" on public.property_media;

create policy "Public can read media of active properties"
  on public.property_media for select to anon, authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'active'
    )
  );

create policy "Authenticated can manage property_media"
  on public.property_media for all to authenticated
  using (true) with check (true);

create policy "Anon full access property_media (DEV ONLY)"
  on public.property_media for all to anon
  using (true) with check (true);

drop policy if exists "Public can read floor plans of active properties" on public.property_floor_plans;
drop policy if exists "Authenticated can manage property_floor_plans" on public.property_floor_plans;
drop policy if exists "Anon full access property_floor_plans (DEV ONLY)" on public.property_floor_plans;

create policy "Public can read floor plans of active properties"
  on public.property_floor_plans for select to anon, authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'active'
    )
  );

create policy "Authenticated can manage property_floor_plans"
  on public.property_floor_plans for all to authenticated
  using (true) with check (true);

create policy "Anon full access property_floor_plans (DEV ONLY)"
  on public.property_floor_plans for all to anon
  using (true) with check (true);

drop policy if exists "Public can read amenities of active properties" on public.property_amenities;
drop policy if exists "Authenticated can manage property_amenities" on public.property_amenities;
drop policy if exists "Anon full access property_amenities (DEV ONLY)" on public.property_amenities;

create policy "Public can read amenities of active properties"
  on public.property_amenities for select to anon, authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'active'
    )
  );

create policy "Authenticated can manage property_amenities"
  on public.property_amenities for all to authenticated
  using (true) with check (true);

create policy "Anon full access property_amenities (DEV ONLY)"
  on public.property_amenities for all to anon
  using (true) with check (true);

drop policy if exists "Public can read highlights of active properties" on public.property_highlights;
drop policy if exists "Authenticated can manage property_highlights" on public.property_highlights;
drop policy if exists "Anon full access property_highlights (DEV ONLY)" on public.property_highlights;

create policy "Public can read highlights of active properties"
  on public.property_highlights for select to anon, authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'active'
    )
  );

create policy "Authenticated can manage property_highlights"
  on public.property_highlights for all to authenticated
  using (true) with check (true);

create policy "Anon full access property_highlights (DEV ONLY)"
  on public.property_highlights for all to anon
  using (true) with check (true);

drop policy if exists "Public can read specs of active properties" on public.property_specs;
drop policy if exists "Authenticated can manage property_specs" on public.property_specs;
drop policy if exists "Anon full access property_specs (DEV ONLY)" on public.property_specs;

create policy "Public can read specs of active properties"
  on public.property_specs for select to anon, authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'active'
    )
  );

create policy "Authenticated can manage property_specs"
  on public.property_specs for all to authenticated
  using (true) with check (true);

create policy "Anon full access property_specs (DEV ONLY)"
  on public.property_specs for all to anon
  using (true) with check (true);

drop policy if exists "Public can read faqs of active properties" on public.property_faqs;
drop policy if exists "Authenticated can manage property_faqs" on public.property_faqs;
drop policy if exists "Anon full access property_faqs (DEV ONLY)" on public.property_faqs;

create policy "Public can read faqs of active properties"
  on public.property_faqs for select to anon, authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'active'
    )
  );

create policy "Authenticated can manage property_faqs"
  on public.property_faqs for all to authenticated
  using (true) with check (true);

create policy "Anon full access property_faqs (DEV ONLY)"
  on public.property_faqs for all to anon
  using (true) with check (true);



-- ------------------------------------------------------------
-- 014_admin_roles_manager.sql
-- ------------------------------------------------------------
-- Allow Manager role on admin_profiles (in addition to Super Admin)
-- Run in Supabase â†’ SQL Editor

alter table public.admin_profiles
  drop constraint if exists admin_profiles_role_check;

alter table public.admin_profiles
  add constraint admin_profiles_role_check
  check (role in ('Super Admin', 'Manager'));



-- ------------------------------------------------------------
-- 015_property_rate_cards_and_spec_labels.sql
-- ------------------------------------------------------------
-- ============================================================
-- Property rate cards (JSONB) + labeled specs
-- Run in Supabase â†’ SQL Editor after 013_properties.sql
-- ============================================================

alter table public.properties
  add column if not exists rate_cards jsonb not null default '[]'::jsonb;

alter table public.property_specs
  add column if not exists label text;

comment on column public.properties.rate_cards is
  'Array of { id, title, price, notes } rate card objects';

comment on column public.property_specs.label is
  'Optional label for spec rows; content holds the value';



-- ------------------------------------------------------------
-- 016_static_options_image.sql
-- ------------------------------------------------------------
-- Area (and other static_options) cover image support
alter table public.static_options
  add column if not exists image_url text,
  add column if not exists cloudinary_public_id text;



-- ------------------------------------------------------------
-- 017_site_users_and_likes.sql
-- ------------------------------------------------------------
-- ============================================================
-- Site users + saved properties (likes) keyed by MOBILE NUMBER
-- Powers the public website "login via number" + saved homes.
-- Run in Supabase â†’ SQL Editor
-- Written / read server-side with the service_role key only.
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

-- ------------------------------------------------------------
-- Site users â€” one row per verified mobile number (the identity)
-- ------------------------------------------------------------
create table if not exists public.site_users (
  phone text primary key,                 -- E.164, e.g. +919812345678
  name text,
  email text,
  dial_code text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create index if not exists site_users_email_idx on public.site_users (email);
create index if not exists site_users_created_at_idx on public.site_users (created_at);

drop trigger if exists site_users_set_updated_at on public.site_users;
create trigger site_users_set_updated_at
  before update on public.site_users
  for each row
  execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Saved properties (likes) â€” many per phone
-- ------------------------------------------------------------
create table if not exists public.user_likes (
  phone text not null references public.site_users (phone) on delete cascade,
  slug text not null,
  created_at timestamptz not null default now(),
  primary key (phone, slug)
);

create index if not exists user_likes_phone_idx on public.user_likes (phone);
create index if not exists user_likes_created_at_idx on public.user_likes (created_at);

-- ------------------------------------------------------------
-- Security: these tables are PRIVATE.
-- All access happens server-side via the service_role key, which
-- bypasses RLS. We enable RLS and grant NO anon/authenticated
-- access, so the anon key used for the public catalog can never
-- read one user's phone number or saved list.
-- ------------------------------------------------------------
grant usage on schema public to anon, authenticated;

revoke all on table public.site_users from anon, authenticated;
revoke all on table public.user_likes from anon, authenticated;

alter table public.site_users enable row level security;
alter table public.user_likes enable row level security;

-- No policies created on purpose â†’ anon/authenticated are denied.
-- service_role bypasses RLS and retains full access.



-- ------------------------------------------------------------
-- 018_lead_inbox.sql
-- ------------------------------------------------------------
-- ============================================================
-- Lead inbox: contact enquiries + browse unlocks
-- Run in Supabase â†’ SQL Editor (after 017)
-- Written from website via service_role; read from admin via service_role.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Contact desk â€” submissions from /contact
-- ------------------------------------------------------------
create table if not exists public.contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  message text not null,
  source text not null default 'contact_page',
  status text not null default 'new'
    check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists contact_enquiries_created_at_idx
  on public.contact_enquiries (created_at desc);
create index if not exists contact_enquiries_status_idx
  on public.contact_enquiries (status);

-- ------------------------------------------------------------
-- Browse unlocks â€” visitors who signed in to see more listings
-- (hit free-view gate, then verified phone)
-- ------------------------------------------------------------
create table if not exists public.browse_unlocks (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  name text,
  email text,
  intent_path text,
  viewed_slugs text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists browse_unlocks_created_at_idx
  on public.browse_unlocks (created_at desc);
create index if not exists browse_unlocks_phone_idx
  on public.browse_unlocks (phone);

-- ------------------------------------------------------------
-- Private tables â€” service_role only (same pattern as site_users)
-- ------------------------------------------------------------
revoke all on table public.contact_enquiries from anon, authenticated;
revoke all on table public.browse_unlocks from anon, authenticated;

alter table public.contact_enquiries enable row level security;
alter table public.browse_unlocks enable row level security;



-- ------------------------------------------------------------
-- 019_contact_desk_notes_status.sql
-- ------------------------------------------------------------
-- ============================================================
-- Contact desk: CRM statuses + notes
-- Run in Supabase â†’ SQL Editor
-- Safe to re-run. Also creates base tables if 018 was never applied.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Contact enquiries (base table)
-- ------------------------------------------------------------
create table if not exists public.contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  message text not null,
  source text not null default 'contact_page',
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists contact_enquiries_created_at_idx
  on public.contact_enquiries (created_at desc);
create index if not exists contact_enquiries_status_idx
  on public.contact_enquiries (status);

-- Migrate legacy status values
update public.contact_enquiries
set status = 'connected'
where status = 'contacted';

-- Widen status check for CRM follow-up flow
alter table public.contact_enquiries
  drop constraint if exists contact_enquiries_status_check;

alter table public.contact_enquiries
  add constraint contact_enquiries_status_check
  check (
    status in (
      'new',
      'attempting',
      'connected',
      'recall_done',
      'not_reachable',
      'closed'
    )
  );

-- ------------------------------------------------------------
-- Notes on each enquiry (admin follow-ups)
-- ------------------------------------------------------------
create table if not exists public.contact_enquiry_notes (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null
    references public.contact_enquiries (id) on delete cascade,
  note text not null,
  created_by_name text,
  created_by_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists contact_enquiry_notes_enquiry_id_idx
  on public.contact_enquiry_notes (enquiry_id, created_at desc);

-- ------------------------------------------------------------
-- Browse unlocks (from 018 â€” create if missing)
-- ------------------------------------------------------------
create table if not exists public.browse_unlocks (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  name text,
  email text,
  intent_path text,
  viewed_slugs text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists browse_unlocks_created_at_idx
  on public.browse_unlocks (created_at desc);
create index if not exists browse_unlocks_phone_idx
  on public.browse_unlocks (phone);

-- ------------------------------------------------------------
-- Private â€” service_role only
-- ------------------------------------------------------------
revoke all on table public.contact_enquiries from anon, authenticated;
revoke all on table public.contact_enquiry_notes from anon, authenticated;
revoke all on table public.browse_unlocks from anon, authenticated;

grant all on table public.contact_enquiries to service_role;
grant all on table public.contact_enquiry_notes to service_role;
grant all on table public.browse_unlocks to service_role;

alter table public.contact_enquiries enable row level security;
alter table public.contact_enquiry_notes enable row level security;
alter table public.browse_unlocks enable row level security;



-- ------------------------------------------------------------
-- 020_fix_contact_desk_grants.sql
-- ------------------------------------------------------------
-- ============================================================
-- FIX: permission denied for table contact_enquiries
-- Run this in Supabase â†’ SQL Editor (one time)
-- ============================================================

grant usage on schema public to service_role;

grant all on table public.contact_enquiries to service_role;
grant all on table public.contact_enquiry_notes to service_role;
grant all on table public.browse_unlocks to service_role;

-- Keep public clients blocked (writes go through website service_role only)
revoke all on table public.contact_enquiries from anon, authenticated;
revoke all on table public.contact_enquiry_notes from anon, authenticated;
revoke all on table public.browse_unlocks from anon, authenticated;



-- ------------------------------------------------------------
-- 021_enquiry_status_recall.sql
-- ------------------------------------------------------------
-- ============================================================
-- Contact desk statuses: drop attempting/closed, add recall
-- Run in Supabase â†’ SQL Editor. Safe to re-run.
-- ============================================================

-- Map legacy values before tightening the check
update public.contact_enquiries
set status = 'new'
where status = 'attempting';

update public.contact_enquiries
set status = 'recall'
where status = 'recall_done';

update public.contact_enquiries
set status = 'not_reachable'
where status = 'closed';

alter table public.contact_enquiries
  drop constraint if exists contact_enquiries_status_check;

alter table public.contact_enquiries
  add constraint contact_enquiries_status_check
  check (
    status in (
      'new',
      'connected',
      'recall',
      'not_reachable'
    )
  );



-- ------------------------------------------------------------
-- 022_floor_plan_carpet_area.sql
-- ------------------------------------------------------------
-- Carpet area for floor plans (super built-up remains area_sqft / area_sqyd)
alter table public.property_floor_plans
  add column if not exists carpet_area_sqft numeric(12, 2),
  add column if not exists carpet_area_sqyd numeric(12, 2);



-- ------------------------------------------------------------
-- 023_builders_real_brand_roster.sql
-- ------------------------------------------------------------
-- ============================================================
-- Real brand roster + original logo paths (local /builders/*)
-- Prefer uploading HQ originals to Cloudinary via Admin in prod.
-- Run in Supabase â†’ SQL Editor after deploying logo files.
-- ============================================================

-- 0) Normalize older alias names onto the final roster names
--    (skip if the target name already exists to avoid unique conflicts)

do $$
begin
  if exists (select 1 from public.builders where name = 'Sangath IPL')
     and not exists (select 1 from public.builders where name = 'Sangath Pro') then
    update public.builders
    set name = 'Sangath Pro', updated_at = now()
    where name = 'Sangath IPL';
  end if;

  if exists (select 1 from public.builders where name = 'Kavyaratna')
     and not exists (select 1 from public.builders where name = 'Kaavyaratna Group') then
    update public.builders
    set name = 'Kaavyaratna Group', updated_at = now()
    where name = 'Kavyaratna';
  end if;

  if exists (select 1 from public.builders where name = 'Kavyaratna Group')
     and not exists (select 1 from public.builders where name = 'Kaavyaratna Group') then
    update public.builders
    set name = 'Kaavyaratna Group', updated_at = now()
    where name = 'Kavyaratna Group';
  end if;

  if exists (select 1 from public.builders where name = 'Pravish')
     and not exists (select 1 from public.builders where name = 'Pravish Group') then
    update public.builders
    set name = 'Pravish Group', updated_at = now()
    where name = 'Pravish';
  end if;

  if exists (select 1 from public.builders where name = 'Reneev')
     and not exists (select 1 from public.builders where name = 'Reneev Developers') then
    update public.builders
    set name = 'Reneev Developers', updated_at = now()
    where name = 'Reneev';
  end if;
end $$;

-- Soft-drop leftover alias rows if both old + new exist
update public.builders
set status = 'inactive', updated_at = now()
where name in ('Sangath IPL', 'Sangath', 'Kavyaratna', 'Kavyaratna Group', 'Pravish', 'Reneev');

-- 1) Upsert the active brand list with original logo files
with roster(name, website, logo_url, sort_order) as (
  values
    ('Shivalik Group',       'https://shivalikgroup.com',           '/builders/shivalik.svg',            1),
    ('Shilp Group',          'https://shilpgroup.com',              '/builders/shilp.jpg',               2),
    ('Sobha Limited',        'https://www.sobha.com',               '/builders/sobha.png',               3),
    ('Trogon Group',         'https://trogongroup.com',             '/builders/trogon.svg',              4),
    ('Gala Infrastructure',  'https://galainfra.com',               '/builders/gala.png',                5),
    ('HN Safal',             'https://www.hnsafal.com',             '/builders/hn-safal.png',            6),
    ('B Safal',              'https://bsafal.com',                  '/builders/b-safal.png',             7),
    ('Swati Procon',         'https://www.swatiprocon.com',         '/builders/swati.png',               8),
    ('Savvy Group',          'https://savvygroup.in',               '/builders/savvy.png',               9),
    ('Sangath Pro',          'https://sangathpro.com',              '/builders/sangath.png',            10),
    ('Ganesh Housing',       'https://www.ganeshhousing.com',       '/builders/ganesh-housing.png',     11),
    ('Tremont Group',        'https://tremontinfra.com',            '/builders/tremont.png',            12),
    ('Pravish Group',        'https://pravishgroup.com',            '/builders/pravish.png',            13),
    ('Rajyash Group',        'https://rajyashgroup.com',            '/builders/rajyash.webp',           14),
    ('Adani Realty',         'https://adanirealty.com',             '/builders/adani.svg',              15),
    ('Addor Group',          'https://addorgroup.com',              '/builders/addor.png',              16),
    ('Aaryan Group',         'https://aaryangroup.com',             '/builders/aaryan.png',             17),
    ('Reneev Developers',    'https://reneevdevelopers.com',        '/builders/reneev.png',             18),
    ('Swagat Group',         'https://www.swagatgroup.in',          '/builders/swagat.svg',             19),
    ('Kaavyaratna Group',    'https://kaavyaratna.com',             '/builders/kavyaratna.png',         20),
    ('Nakshatra Group',      'https://nakshatra-group.com',         '/builders/nakshatra.svg',          21),
    ('Bakeri Group',         'https://bakeri.com',                  '/builders/bakeri.png',             22),
    ('Godrej Properties',    'https://godrejproperties.com',        '/builders/godrej-properties.svg',  23),
    ('Saamarth Group',       'https://saamarthgroup.com',           '/builders/saamarth.png',           24),
    ('Goyal & Co.',          'https://goyalco.com',                 '/builders/goyal-co.png',           25)
)
insert into public.builders as b (name, website, logo_url, status, sort_order, tier)
select r.name, r.website, r.logo_url, 'active', r.sort_order, 1
from roster r
on conflict (name) do update
set
  website = excluded.website,
  logo_url = excluded.logo_url,
  status = 'active',
  sort_order = excluded.sort_order,
  updated_at = now();

-- 2) Soft-deactivate brands not in the new roster (keep FK links intact)
update public.builders
set status = 'inactive', updated_at = now()
where name not in (
  'Shivalik Group',
  'Shilp Group',
  'Sobha Limited',
  'Trogon Group',
  'Gala Infrastructure',
  'HN Safal',
  'B Safal',
  'Swati Procon',
  'Savvy Group',
  'Sangath Pro',
  'Ganesh Housing',
  'Tremont Group',
  'Pravish Group',
  'Rajyash Group',
  'Adani Realty',
  'Addor Group',
  'Aaryan Group',
  'Reneev Developers',
  'Swagat Group',
  'Kaavyaratna Group',
  'Nakshatra Group',
  'Bakeri Group',
  'Godrej Properties',
  'Saamarth Group',
  'Goyal & Co.'
);



-- ------------------------------------------------------------
-- 024_digital_cards.sql
-- ------------------------------------------------------------
-- ============================================================
-- Digital visiting cards â€” one per admin_profiles row
-- Shared address / RERA live in app constants (not per-row).
-- ============================================================

create table if not exists public.digital_cards (
  id uuid primary key default gen_random_uuid(),
  admin_profile_id uuid not null unique
    references public.admin_profiles (id) on delete cascade,
  slug text not null,
  display_name text not null,
  first_name text not null,
  last_name text not null,
  role_title text not null default 'Property Advisor',
  tagline text not null default 'Private guidance for homes that feel like the right beginning.',
  phone_display text not null default '',
  phone_tel text not null default '',
  whatsapp text not null default '',
  email text not null,
  photo_url text,
  accent text not null default 'steel' 
    check (accent in ('steel', 'bronze')),
  cover_url text not null default
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint digital_cards_slug_unique unique (slug)
);

create index if not exists digital_cards_slug_idx on public.digital_cards (slug);
create index if not exists digital_cards_status_idx on public.digital_cards (status);
create index if not exists digital_cards_admin_profile_id_idx
  on public.digital_cards (admin_profile_id);

drop trigger if exists digital_cards_set_updated_at on public.digital_cards;
create trigger digital_cards_set_updated_at
  before update on public.digital_cards
  for each row
  execute function public.set_updated_at();

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table public.digital_cards to authenticated;
grant select on table public.digital_cards to anon;
grant all on table public.digital_cards to service_role;
grant all on table public.digital_cards to postgres;

alter table public.digital_cards enable row level security;

drop policy if exists "Authenticated can manage digital cards" on public.digital_cards;
drop policy if exists "Anon can read active digital cards" on public.digital_cards;

create policy "Authenticated can manage digital cards"
  on public.digital_cards
  for all
  to authenticated
  using (true)
  with check (true);

-- Public website reads active cards only
create policy "Anon can read active digital cards"
  on public.digital_cards
  for select
  to anon
  using (status = 'active');

-- Seed cards for existing admin profiles that do not have one yet
insert into public.digital_cards (
  admin_profile_id,
  slug,
  display_name,
  first_name,
  last_name,
  role_title,
  tagline,
  phone_display,
  phone_tel,
  whatsapp,
  email,
  photo_url,
  accent,
  status
)
select
  p.id,
  lower(
    regexp_replace(
      regexp_replace(trim(p.name), '[^a-zA-Z0-9]+', '-', 'g'),
      '(^-+|-+$)',
      '',
      'g'
    )
  ) || '-' || substr(replace(p.id::text, '-', ''), 1, 6),
  p.name,
  split_part(trim(p.name), ' ', 1),
  coalesce(
    nullif(
      trim(substr(trim(p.name), length(split_part(trim(p.name), ' ', 1)) + 1)),
      ''
    ),
    'Advisor'
  ),
  'Property Advisor',
  'Private guidance for homes that feel like the right beginning.',
  case
    when p.phone is null or length(regexp_replace(p.phone, '\D', '', 'g')) = 0 then ''
    when length(regexp_replace(p.phone, '\D', '', 'g')) = 10
      then '+91 ' || substr(regexp_replace(p.phone, '\D', '', 'g'), 1, 5) || ' '
        || substr(regexp_replace(p.phone, '\D', '', 'g'), 6, 5)
    else '+' || regexp_replace(p.phone, '\D', '', 'g')
  end,
  case
    when p.phone is null or length(regexp_replace(p.phone, '\D', '', 'g')) = 0 then ''
    when length(regexp_replace(p.phone, '\D', '', 'g')) = 10
      then '+91' || regexp_replace(p.phone, '\D', '', 'g')
    else '+' || regexp_replace(p.phone, '\D', '', 'g')
  end,
  case
    when p.phone is null or length(regexp_replace(p.phone, '\D', '', 'g')) = 0 then ''
    when length(regexp_replace(p.phone, '\D', '', 'g')) = 10
      then '91' || regexp_replace(p.phone, '\D', '', 'g')
    else regexp_replace(p.phone, '\D', '', 'g')
  end,
  p.email,
  p.photo_url,
  'steel',
  'active'
from public.admin_profiles p
where not exists (
  select 1 from public.digital_cards c where c.admin_profile_id = p.id
)
on conflict (slug) do nothing;

-- Prefer stable slugs for known advisors when those admin profiles exist
update public.digital_cards c
set
  slug = 'parth-patel',
  display_name = 'Parth Patel',
  first_name = 'Parth',
  last_name = 'Patel',
  role_title = 'Property Advisor',
  tagline = 'Private guidance for homes that feel like the right beginning.',
  phone_display = '+91 76002 71405',
  phone_tel = '+917600271405',
  whatsapp = '917600271405',
  accent = 'steel',
  cover_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
  status = 'active'
from public.admin_profiles p
where c.admin_profile_id = p.id
  and lower(p.name) like '%parth%patel%'
  and not exists (
    select 1 from public.digital_cards x
    where x.slug = 'parth-patel' and x.id <> c.id
  );

update public.digital_cards c
set
  slug = 'sandeep-gauswami',
  display_name = 'Sandeep Gauswami',
  first_name = 'Sandeep',
  last_name = 'Gauswami',
  role_title = 'Property Advisor',
  tagline = 'Trusted counsel for premium residences â€” from first call to keys.',
  phone_display = '+91 87807 52792',
  phone_tel = '+918780752792',
  whatsapp = '918780752792',
  accent = 'bronze',
  cover_url = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80',
  status = 'active'
from public.admin_profiles p
where c.admin_profile_id = p.id
  and lower(p.name) like '%sandeep%gauswami%'
  and not exists (
    select 1 from public.digital_cards x
    where x.slug = 'sandeep-gauswami' and x.id <> c.id
  );



-- ------------------------------------------------------------
-- 025_fix_digital_cards_grants.sql
-- ------------------------------------------------------------
-- ============================================================
-- FIX: permission denied for table digital_cards
-- Run in Supabase â†’ SQL Editor (one time)
-- ============================================================

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table public.digital_cards to authenticated;
grant select on table public.digital_cards to anon;
grant all on table public.digital_cards to service_role;
grant all on table public.digital_cards to postgres;



-- ------------------------------------------------------------
-- 026_digital_cards_address_rera.sql
-- ------------------------------------------------------------
-- Editable address + RERA on each digital card (prefilled from company defaults)
alter table public.digital_cards
  add column if not exists office_address text not null default
    'A 707, Ganesh Glory 11, Jagatpura Road, Gota, Ahmedabad 382470';

alter table public.digital_cards
  add column if not exists maps_query text not null default
    'A 707 Ganesh Glory 11 Jagatpura Road Gota Ahmedabad 382470';

alter table public.digital_cards
  add column if not exists rera text not null default
    'AG/GJ/AHMEDABAD/AHMEDABAD CITY/AA06547/180631R1';

update public.digital_cards
set
  office_address = coalesce(nullif(trim(office_address), ''), 'A 707, Ganesh Glory 11, Jagatpura Road, Gota, Ahmedabad 382470'),
  maps_query = coalesce(nullif(trim(maps_query), ''), 'A 707 Ganesh Glory 11 Jagatpura Road Gota Ahmedabad 382470'),
  rera = coalesce(nullif(trim(rera), ''), 'AG/GJ/AHMEDABAD/AHMEDABAD CITY/AA06547/180631R1');



-- ------------------------------------------------------------
-- 027_digital_cards_tagline.sql
-- ------------------------------------------------------------
-- Default tagline for digital cards
alter table public.digital_cards
  alter column tagline set default 'Create your legacy with strong neev';

-- Refresh cards still on the old default tagline
update public.digital_cards
set tagline = 'Create your legacy with strong neev'
where tagline = 'Private guidance for homes that feel like the right beginning.';


-- ------------------------------------------------------------
-- 029_site_details.sql
-- ------------------------------------------------------------
create table if not exists public.site_details (
  id int primary key default 1 check (id = 1),
  phone_display text not null default '+91 76002 71405',
  phone_tel text not null default '+917600271405',
  email text not null default 'info@neevspaces.com',
  address text not null default 'Gujarat, India',
  updated_at timestamptz not null default now()
);

insert into public.site_details (id, phone_display, phone_tel, email, address)
values (1, '+91 76002 71405', '+917600271405', 'info@neevspaces.com', 'Gujarat, India')
on conflict (id) do nothing;


