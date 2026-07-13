-- ============================================================
-- Amenities (separate from static_options)
-- Run in Supabase → SQL Editor
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

create table if not exists public.amenities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  icon_url text,
  cloudinary_public_id text,
  icon_key text,
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint amenities_title_unique unique (title)
);

create index if not exists amenities_status_idx on public.amenities (status);
create index if not exists amenities_sort_order_idx on public.amenities (sort_order);

drop trigger if exists amenities_set_updated_at on public.amenities;
create trigger amenities_set_updated_at
  before update on public.amenities
  for each row
  execute function public.set_updated_at();

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.amenities to anon, authenticated;

alter table public.amenities enable row level security;

drop policy if exists "Public can read active amenities" on public.amenities;
drop policy if exists "Authenticated can manage amenities" on public.amenities;
drop policy if exists "Anon full access amenities (DEV ONLY)" on public.amenities;

create policy "Public can read active amenities"
  on public.amenities
  for select
  to anon, authenticated
  using (status = 'active');

create policy "Authenticated can manage amenities"
  on public.amenities
  for all
  to authenticated
  using (true)
  with check (true);

-- DEV ONLY until Auth is wired
create policy "Anon full access amenities (DEV ONLY)"
  on public.amenities
  for all
  to anon
  using (true)
  with check (true);

-- Seed amenity list (icon_key = Lucide fallback until custom icon uploaded)
insert into public.amenities (title, icon_key, status, sort_order) values
  ('Security Cabin', 'shield', 'active', 1),
  ('Swimming Pool', 'waves', 'active', 2),
  ('Children''s Play Area', 'toy-brick', 'active', 3),
  ('Common Toilet', 'bath', 'active', 4),
  ('Indoor Game', 'gamepad-2', 'active', 5),
  ('Library', 'book-open', 'active', 6),
  ('Multi-Purpose Court', 'circle-dot', 'active', 7),
  ('Power Backup', 'zap', 'active', 8),
  ('Multipurpose Hall', 'building-2', 'active', 9),
  ('Walking Track', 'footprints', 'active', 10),
  ('Waterbody', 'droplets', 'active', 11),
  ('Home Theater', 'clapperboard', 'active', 12),
  ('Lily Pond', 'flower-2', 'active', 13),
  ('Elegant Entrance', 'door-open', 'active', 14),
  ('Sitting Gazebo', 'home', 'active', 15),
  ('Open Yoga Area', 'heart-pulse', 'active', 16),
  ('Dense Landscape', 'trees', 'active', 17),
  ('Lawn Area With Sit-out', 'leaf', 'active', 18),
  ('Sunken Seating', 'sofa', 'active', 19),
  ('Attractive Sculpture', 'landmark', 'active', 20),
  ('Swing Area', 'sparkles', 'active', 21),
  ('Pool Side Seating Deck', 'umbrella', 'active', 22),
  ('Potted Plants', 'sprout', 'active', 23),
  ('Roof Top Seating', 'building', 'active', 24),
  ('Baby Pool', 'baby', 'active', 25),
  ('Indoor Gym', 'dumbbell', 'active', 26),
  ('Toddler Room', 'baby', 'active', 27),
  ('Net Seating', 'stretch-horizontal', 'active', 28),
  ('Manager Cabin', 'briefcase', 'active', 29),
  ('Attractive Street Light', 'lamp', 'active', 30),
  ('Store Room', 'package', 'active', 31),
  ('Meter Room', 'gauge', 'active', 32),
  ('Two Level Parking', 'car', 'active', 33),
  ('Temple', 'church', 'active', 34)
on conflict (title) do nothing;
