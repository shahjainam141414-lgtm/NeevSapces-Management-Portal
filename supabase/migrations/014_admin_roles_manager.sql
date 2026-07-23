-- Allow Manager role on admin_profiles (in addition to Super Admin)
-- Run in Supabase → SQL Editor

alter table public.admin_profiles
  drop constraint if exists admin_profiles_role_check;

alter table public.admin_profiles
  add constraint admin_profiles_role_check
  check (role in ('Super Admin', 'Manager'));
