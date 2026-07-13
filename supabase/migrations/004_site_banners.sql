-- ============================================================
-- Main Banner — store Cloudinary image URL for website hero
-- Run in Supabase → SQL Editor
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
