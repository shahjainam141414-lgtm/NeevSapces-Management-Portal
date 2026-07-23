-- ============================================================
-- Property rate cards (JSONB) + labeled specs
-- Run in Supabase → SQL Editor after 013_properties.sql
-- ============================================================

alter table public.properties
  add column if not exists rate_cards jsonb not null default '[]'::jsonb;

alter table public.property_specs
  add column if not exists label text;

comment on column public.properties.rate_cards is
  'Array of { id, title, price, notes } rate card objects';

comment on column public.property_specs.label is
  'Optional label for spec rows; content holds the value';
