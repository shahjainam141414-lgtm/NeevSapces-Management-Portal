-- Featured properties curated per area (admin; website can consume later)
create table if not exists public.area_featured_properties (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.static_options (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint area_featured_properties_unique unique (area_id, property_id)
);

create index if not exists area_featured_properties_area_id_idx
  on public.area_featured_properties (area_id);

create index if not exists area_featured_properties_property_id_idx
  on public.area_featured_properties (property_id);

alter table public.area_featured_properties enable row level security;

drop policy if exists "Authenticated can manage area featured properties"
  on public.area_featured_properties;
create policy "Authenticated can manage area featured properties"
  on public.area_featured_properties
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Anon full access area featured (DEV ONLY)"
  on public.area_featured_properties;
create policy "Anon full access area featured (DEV ONLY)"
  on public.area_featured_properties
  for all
  to anon
  using (true)
  with check (true);

grant select, insert, update, delete on table public.area_featured_properties
  to anon, authenticated;
