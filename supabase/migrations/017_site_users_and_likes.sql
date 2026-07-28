-- ============================================================
-- Site users + saved properties (likes) keyed by MOBILE NUMBER
-- Powers the public website "login via number" + saved homes.
-- Run in Supabase → SQL Editor
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
-- Site users — one row per verified mobile number (the identity)
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
-- Saved properties (likes) — many per phone
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

-- No policies created on purpose → anon/authenticated are denied.
-- service_role bypasses RLS and retains full access.
