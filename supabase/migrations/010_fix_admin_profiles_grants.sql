-- ============================================================
-- Fix grants on admin_profiles (fixes "permission denied")
-- Run in Supabase → SQL Editor
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
