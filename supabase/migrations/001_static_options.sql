-- ============================================================
-- Neev Admin — Static Options (lookup / master data)
-- Run this in Supabase → SQL Editor → New query → Run
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
-- API privileges (required — without these you get 401 / 42501)
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
-- DEV ONLY — remove this policy once Supabase Auth is wired
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
