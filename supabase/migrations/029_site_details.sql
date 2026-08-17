-- ============================================================
-- Site contact details (phone, email, address)
-- Singleton row id = 1
-- Run in Supabase → SQL Editor (Dev + Prod)
-- ============================================================

create table if not exists public.site_details (
  id int primary key default 1 check (id = 1),
  phone_display text not null default '+91 76002 71405',
  phone_tel text not null default '+917600271405',
  email text not null default 'info@neevspaces.com',
  address text not null default 'Gujarat, India',
  updated_at timestamptz not null default now()
);

drop trigger if exists site_details_set_updated_at on public.site_details;
create trigger site_details_set_updated_at
  before update on public.site_details
  for each row
  execute function public.set_updated_at();

grant select, insert, update on table public.site_details to anon, authenticated;

alter table public.site_details enable row level security;

drop policy if exists "Public can read site details" on public.site_details;
drop policy if exists "Authenticated can manage site details" on public.site_details;

create policy "Public can read site details"
  on public.site_details
  for select
  to anon, authenticated
  using (true);

create policy "Authenticated can manage site details"
  on public.site_details
  for all
  to authenticated
  using (true)
  with check (true);

insert into public.site_details (id, phone_display, phone_tel, email, address)
values (1, '+91 76002 71405', '+917600271405', 'info@neevspaces.com', 'Gujarat, India')
on conflict (id) do nothing;
