-- ============================================================
-- FIX: permission denied for table contact_enquiries
-- Run this in Supabase → SQL Editor (one time)
-- ============================================================

grant usage on schema public to service_role;

grant all on table public.contact_enquiries to service_role;
grant all on table public.contact_enquiry_notes to service_role;
grant all on table public.browse_unlocks to service_role;

-- Keep public clients blocked (writes go through website service_role only)
revoke all on table public.contact_enquiries from anon, authenticated;
revoke all on table public.contact_enquiry_notes from anon, authenticated;
revoke all on table public.browse_unlocks from anon, authenticated;
