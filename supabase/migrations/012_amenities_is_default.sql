-- ============================================================
-- Amenities — is_default (Yes / No)
-- Run in Supabase → SQL Editor
-- ============================================================

alter table public.amenities
  add column if not exists is_default boolean not null default false;

create index if not exists amenities_is_default_idx
  on public.amenities (is_default);

comment on column public.amenities.is_default is
  'When true, amenity is treated as a default selection for listings.';
