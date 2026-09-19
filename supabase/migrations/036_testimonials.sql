create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  quote text not null,
  sort_order integer not null default 0,
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists testimonials_status_sort_idx
  on public.testimonials (status, sort_order, created_at);

drop trigger if exists testimonials_set_updated_at on public.testimonials;
create trigger testimonials_set_updated_at
  before update on public.testimonials
  for each row
  execute function public.set_updated_at();

alter table public.testimonials enable row level security;

drop policy if exists "testimonials_anon_read" on public.testimonials;
create policy "testimonials_anon_read"
  on public.testimonials
  for select
  to anon
  using (status = 'active');

drop policy if exists "testimonials_authenticated_all" on public.testimonials;
create policy "testimonials_authenticated_all"
  on public.testimonials
  for all
  to authenticated
  using (true)
  with check (true);

grant select on table public.testimonials to anon;
grant select, insert, update, delete on table public.testimonials to authenticated;
grant all on table public.testimonials to service_role;
