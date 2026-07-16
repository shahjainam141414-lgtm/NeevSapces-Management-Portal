-- ============================================================
-- Properties — full project listings (Privilon-style detail)
-- Run in Supabase → SQL Editor
-- Depends on: static_options (areas), builders, amenities
-- ============================================================

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(
    lower(coalesce(input, '')),
    '[^a-z0-9]+',
    '-',
    'g'
  ));
$$;

-- ------------------------------------------------------------
-- Main property / project listing
-- ------------------------------------------------------------
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),

  -- Identity
  title text not null,
  slug text not null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'inactive')),
  is_featured boolean not null default false,
  listing_badge text not null default 'For Sale',

  -- Location (area selected first in admin)
  area_id uuid references public.static_options (id) on delete set null,
  area_name text,
  locality text,
  city text not null default 'Gandhinagar',
  pincode text,
  full_address text,

  -- Media
  cover_image_url text,
  cover_cloudinary_public_id text,
  brochure_url text,

  -- Pricing (rate card)
  package_price_label text,
  package_price_notes text,
  price_per_sqft_label text,

  -- Quick "Details" strip
  availability text[] not null default '{}',
  possession_by text,
  property_type_label text,
  tower_count int,
  unit_count int,
  rera_no text,
  rera_url text,

  -- Developer / category
  builder_id uuid references public.builders (id) on delete set null,
  developer_name text,
  category_label text,
  construction_status text,

  -- Project meta
  project_size_label text,
  floor_count int,
  total_plot_area text,
  open_area_percent numeric(5, 2),
  parking_types text[] not null default '{}',
  facing text,
  project_position text,
  road_connectivity text,
  current_status text default 'Available',

  -- Long-form
  about text,

  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint properties_slug_unique unique (slug),
  constraint properties_title_check check (char_length(trim(title)) > 0)
);

create index if not exists properties_area_id_idx on public.properties (area_id);
create index if not exists properties_builder_id_idx on public.properties (builder_id);
create index if not exists properties_status_idx on public.properties (status);
create index if not exists properties_slug_idx on public.properties (slug);
create index if not exists properties_sort_order_idx on public.properties (sort_order);

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
  before update on public.properties
  for each row
  execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Gallery photos
-- ------------------------------------------------------------
create table if not exists public.property_media (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  image_url text not null,
  cloudinary_public_id text,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists property_media_property_id_idx
  on public.property_media (property_id);

drop trigger if exists property_media_set_updated_at on public.property_media;
create trigger property_media_set_updated_at
  before update on public.property_media
  for each row
  execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Floor plans + unit configs (3 BHK Type 1, etc.)
-- ------------------------------------------------------------
create table if not exists public.property_floor_plans (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  name text not null,
  bhk_label text,
  rooms int,
  balcony int,
  bathroom int,
  servant_room int,
  area_sqft numeric(12, 2),
  area_sqyd numeric(12, 2),
  area_sqmt numeric(12, 2),
  price_label text,
  image_url text,
  cloudinary_public_id text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists property_floor_plans_property_id_idx
  on public.property_floor_plans (property_id);

drop trigger if exists property_floor_plans_set_updated_at on public.property_floor_plans;
create trigger property_floor_plans_set_updated_at
  before update on public.property_floor_plans
  for each row
  execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Amenities junction
-- ------------------------------------------------------------
create table if not exists public.property_amenities (
  property_id uuid not null references public.properties (id) on delete cascade,
  amenity_id uuid not null references public.amenities (id) on delete cascade,
  sort_order int not null default 0,
  primary key (property_id, amenity_id)
);

create index if not exists property_amenities_amenity_id_idx
  on public.property_amenities (amenity_id);

-- ------------------------------------------------------------
-- "Why this project" highlights
-- ------------------------------------------------------------
create table if not exists public.property_highlights (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  content text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists property_highlights_property_id_idx
  on public.property_highlights (property_id);

-- ------------------------------------------------------------
-- Specifications
-- ------------------------------------------------------------
create table if not exists public.property_specs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  content text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists property_specs_property_id_idx
  on public.property_specs (property_id);

-- ------------------------------------------------------------
-- FAQs
-- ------------------------------------------------------------
create table if not exists public.property_faqs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists property_faqs_property_id_idx
  on public.property_faqs (property_id);

drop trigger if exists property_faqs_set_updated_at on public.property_faqs;
create trigger property_faqs_set_updated_at
  before update on public.property_faqs
  for each row
  execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Grants + RLS (match existing admin pattern)
-- ------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table public.properties to anon, authenticated;
grant select, insert, update, delete on table public.property_media to anon, authenticated;
grant select, insert, update, delete on table public.property_floor_plans to anon, authenticated;
grant select, insert, update, delete on table public.property_amenities to anon, authenticated;
grant select, insert, update, delete on table public.property_highlights to anon, authenticated;
grant select, insert, update, delete on table public.property_specs to anon, authenticated;
grant select, insert, update, delete on table public.property_faqs to anon, authenticated;

alter table public.properties enable row level security;
alter table public.property_media enable row level security;
alter table public.property_floor_plans enable row level security;
alter table public.property_amenities enable row level security;
alter table public.property_highlights enable row level security;
alter table public.property_specs enable row level security;
alter table public.property_faqs enable row level security;

-- properties
drop policy if exists "Public can read active properties" on public.properties;
drop policy if exists "Authenticated can manage properties" on public.properties;
drop policy if exists "Anon full access properties (DEV ONLY)" on public.properties;

create policy "Public can read active properties"
  on public.properties for select to anon, authenticated
  using (status = 'active');

create policy "Authenticated can manage properties"
  on public.properties for all to authenticated
  using (true) with check (true);

create policy "Anon full access properties (DEV ONLY)"
  on public.properties for all to anon
  using (true) with check (true);

-- helper for child tables: allow if parent is active OR authenticated/anon manage
drop policy if exists "Public can read media of active properties" on public.property_media;
drop policy if exists "Authenticated can manage property_media" on public.property_media;
drop policy if exists "Anon full access property_media (DEV ONLY)" on public.property_media;

create policy "Public can read media of active properties"
  on public.property_media for select to anon, authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'active'
    )
  );

create policy "Authenticated can manage property_media"
  on public.property_media for all to authenticated
  using (true) with check (true);

create policy "Anon full access property_media (DEV ONLY)"
  on public.property_media for all to anon
  using (true) with check (true);

drop policy if exists "Public can read floor plans of active properties" on public.property_floor_plans;
drop policy if exists "Authenticated can manage property_floor_plans" on public.property_floor_plans;
drop policy if exists "Anon full access property_floor_plans (DEV ONLY)" on public.property_floor_plans;

create policy "Public can read floor plans of active properties"
  on public.property_floor_plans for select to anon, authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'active'
    )
  );

create policy "Authenticated can manage property_floor_plans"
  on public.property_floor_plans for all to authenticated
  using (true) with check (true);

create policy "Anon full access property_floor_plans (DEV ONLY)"
  on public.property_floor_plans for all to anon
  using (true) with check (true);

drop policy if exists "Public can read amenities of active properties" on public.property_amenities;
drop policy if exists "Authenticated can manage property_amenities" on public.property_amenities;
drop policy if exists "Anon full access property_amenities (DEV ONLY)" on public.property_amenities;

create policy "Public can read amenities of active properties"
  on public.property_amenities for select to anon, authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'active'
    )
  );

create policy "Authenticated can manage property_amenities"
  on public.property_amenities for all to authenticated
  using (true) with check (true);

create policy "Anon full access property_amenities (DEV ONLY)"
  on public.property_amenities for all to anon
  using (true) with check (true);

drop policy if exists "Public can read highlights of active properties" on public.property_highlights;
drop policy if exists "Authenticated can manage property_highlights" on public.property_highlights;
drop policy if exists "Anon full access property_highlights (DEV ONLY)" on public.property_highlights;

create policy "Public can read highlights of active properties"
  on public.property_highlights for select to anon, authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'active'
    )
  );

create policy "Authenticated can manage property_highlights"
  on public.property_highlights for all to authenticated
  using (true) with check (true);

create policy "Anon full access property_highlights (DEV ONLY)"
  on public.property_highlights for all to anon
  using (true) with check (true);

drop policy if exists "Public can read specs of active properties" on public.property_specs;
drop policy if exists "Authenticated can manage property_specs" on public.property_specs;
drop policy if exists "Anon full access property_specs (DEV ONLY)" on public.property_specs;

create policy "Public can read specs of active properties"
  on public.property_specs for select to anon, authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'active'
    )
  );

create policy "Authenticated can manage property_specs"
  on public.property_specs for all to authenticated
  using (true) with check (true);

create policy "Anon full access property_specs (DEV ONLY)"
  on public.property_specs for all to anon
  using (true) with check (true);

drop policy if exists "Public can read faqs of active properties" on public.property_faqs;
drop policy if exists "Authenticated can manage property_faqs" on public.property_faqs;
drop policy if exists "Anon full access property_faqs (DEV ONLY)" on public.property_faqs;

create policy "Public can read faqs of active properties"
  on public.property_faqs for select to anon, authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'active'
    )
  );

create policy "Authenticated can manage property_faqs"
  on public.property_faqs for all to authenticated
  using (true) with check (true);

create policy "Anon full access property_faqs (DEV ONLY)"
  on public.property_faqs for all to anon
  using (true) with check (true);
