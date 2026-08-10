-- ============================================================
-- FIX: permission denied for table digital_cards
-- Run in Supabase → SQL Editor (one time)
-- ============================================================

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table public.digital_cards to authenticated;
grant select on table public.digital_cards to anon;
grant all on table public.digital_cards to service_role;
grant all on table public.digital_cards to postgres;
