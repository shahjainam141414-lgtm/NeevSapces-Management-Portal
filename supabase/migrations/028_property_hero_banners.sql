-- ============================================================
-- Property homepage hero banners
-- Run in Supabase → SQL Editor (Dev + Prod)
-- ============================================================

alter table public.properties
  add column if not exists hero_banner_url text;

alter table public.properties
  add column if not exists hero_banner_cloudinary_public_id text;

alter table public.properties
  add column if not exists is_hero_banner boolean not null default false;

create index if not exists properties_is_hero_banner_idx
  on public.properties (is_hero_banner)
  where is_hero_banner = true;

create index if not exists properties_hero_banner_url_idx
  on public.properties (id)
  where hero_banner_url is not null;
