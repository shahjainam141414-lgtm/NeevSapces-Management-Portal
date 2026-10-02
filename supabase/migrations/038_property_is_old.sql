-- Old properties: hidden from the main site lists.
-- They appear only in the Old properties section on an area page and a builder page.
-- Run in Supabase → SQL Editor.

alter table public.properties
  add column if not exists is_old boolean not null default false;

create index if not exists properties_is_old_idx
  on public.properties (is_old)
  where is_old = true;
