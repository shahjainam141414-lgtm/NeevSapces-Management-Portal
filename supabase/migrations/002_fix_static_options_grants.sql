-- ============================================================
-- FIX: permission_denied for table static_options (401 / 42501)
-- Run this NOW in Supabase → SQL Editor → Run
-- ============================================================
-- Your table exists and has data. The API role `anon` is missing
-- table GRANTs + RLS policies (Table Editor shows "0 RLS policies").
-- ============================================================

-- 1) Table privileges for API roles
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.static_options to anon, authenticated;

-- If you ever add sequences later:
-- grant usage, select on all sequences in schema public to anon, authenticated;

-- 2) Enable RLS
alter table public.static_options enable row level security;

-- 3) Recreate policies (safe to re-run)
drop policy if exists "Public can read active options" on public.static_options;
drop policy if exists "Authenticated can read all options" on public.static_options;
drop policy if exists "Authenticated can insert options" on public.static_options;
drop policy if exists "Authenticated can update options" on public.static_options;
drop policy if exists "Authenticated can delete options" on public.static_options;
drop policy if exists "Anon full access (DEV ONLY)" on public.static_options;

create policy "Public can read active options"
  on public.static_options
  for select
  to anon, authenticated
  using (status = 'active');

create policy "Authenticated can read all options"
  on public.static_options
  for select
  to authenticated
  using (true);

create policy "Authenticated can insert options"
  on public.static_options
  for insert
  to authenticated
  with check (true);

create policy "Authenticated can update options"
  on public.static_options
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete options"
  on public.static_options
  for delete
  to authenticated
  using (true);

-- DEV: allow admin panel CRUD with anon key until Auth is wired
create policy "Anon full access (DEV ONLY)"
  on public.static_options
  for all
  to anon
  using (true)
  with check (true);

-- 4) Quick verify (should return your 4 property types)
select id, type, value, status from public.static_options order by value;
