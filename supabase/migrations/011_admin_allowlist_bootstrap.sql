-- ============================================================
-- Admin allowlist helpers
-- Run in Supabase → SQL Editor
-- ============================================================

-- 1) Ensure grants (safe to re-run)
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on table public.admin_profiles to authenticated;
grant select, insert, update, delete on table public.admin_profiles to anon;
grant all on table public.admin_profiles to service_role;
grant all on table public.admin_profiles to postgres;

-- 2) Bootstrap YOUR Super Admin(s) from existing Google logins
--    ONLY emails listed here can use the admin panel.
--    Replace / add emails as needed, then run this block.

insert into public.admin_profiles (id, name, email, role, status)
select
  u.id,
  coalesce(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ),
  lower(u.email),
  'Super Admin',
  'active'
from auth.users u
where lower(u.email) in (
  lower('shahjainam141414@gmail.com')
  -- , lower('another@email.com')
)
on conflict (id) do update
  set
    name = excluded.name,
    email = excluded.email,
    status = 'active',
    updated_at = now();

-- 3) Optional cleanup: remove Auth users who are NOT allowlisted
--    (keeps auth.users clean — only invited/allowlisted admins remain)
-- WARNING: this deletes Google accounts that were never added via Add User.
-- Uncomment when ready:
--
-- delete from auth.users u
-- where not exists (
--   select 1 from public.admin_profiles p where p.id = u.id
-- );
