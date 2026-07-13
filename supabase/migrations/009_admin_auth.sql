-- ============================================================
-- Admin Auth — profiles linked to auth.users
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
