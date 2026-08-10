-- ============================================================
-- Digital visiting cards — one per admin_profiles row
-- Shared address / RERA live in app constants (not per-row).
-- ============================================================

create table if not exists public.digital_cards (
  id uuid primary key default gen_random_uuid(),
  admin_profile_id uuid not null unique
    references public.admin_profiles (id) on delete cascade,
  slug text not null,
  display_name text not null,
  first_name text not null,
  last_name text not null,
  role_title text not null default 'Property Advisor',
  tagline text not null default 'Private guidance for homes that feel like the right beginning.',
  phone_display text not null default '',
  phone_tel text not null default '',
  whatsapp text not null default '',
  email text not null,
  photo_url text,
  accent text not null default 'steel'
    check (accent in ('steel', 'bronze')),
  cover_url text not null default
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint digital_cards_slug_unique unique (slug)
);

create index if not exists digital_cards_slug_idx on public.digital_cards (slug);
create index if not exists digital_cards_status_idx on public.digital_cards (status);
create index if not exists digital_cards_admin_profile_id_idx
  on public.digital_cards (admin_profile_id);

drop trigger if exists digital_cards_set_updated_at on public.digital_cards;
create trigger digital_cards_set_updated_at
  before update on public.digital_cards
  for each row
  execute function public.set_updated_at();

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table public.digital_cards to authenticated;
grant select on table public.digital_cards to anon;
grant all on table public.digital_cards to service_role;
grant all on table public.digital_cards to postgres;

alter table public.digital_cards enable row level security;

drop policy if exists "Authenticated can manage digital cards" on public.digital_cards;
drop policy if exists "Anon can read active digital cards" on public.digital_cards;

create policy "Authenticated can manage digital cards"
  on public.digital_cards
  for all
  to authenticated
  using (true)
  with check (true);

-- Public website reads active cards only
create policy "Anon can read active digital cards"
  on public.digital_cards
  for select
  to anon
  using (status = 'active');

-- Seed cards for existing admin profiles that do not have one yet
insert into public.digital_cards (
  admin_profile_id,
  slug,
  display_name,
  first_name,
  last_name,
  role_title,
  tagline,
  phone_display,
  phone_tel,
  whatsapp,
  email,
  photo_url,
  accent,
  status
)
select
  p.id,
  lower(
    regexp_replace(
      regexp_replace(trim(p.name), '[^a-zA-Z0-9]+', '-', 'g'),
      '(^-+|-+$)',
      '',
      'g'
    )
  ) || '-' || substr(replace(p.id::text, '-', ''), 1, 6),
  p.name,
  split_part(trim(p.name), ' ', 1),
  coalesce(
    nullif(
      trim(substr(trim(p.name), length(split_part(trim(p.name), ' ', 1)) + 1)),
      ''
    ),
    'Advisor'
  ),
  'Property Advisor',
  'Private guidance for homes that feel like the right beginning.',
  case
    when p.phone is null or length(regexp_replace(p.phone, '\D', '', 'g')) = 0 then ''
    when length(regexp_replace(p.phone, '\D', '', 'g')) = 10
      then '+91 ' || substr(regexp_replace(p.phone, '\D', '', 'g'), 1, 5) || ' '
        || substr(regexp_replace(p.phone, '\D', '', 'g'), 6, 5)
    else '+' || regexp_replace(p.phone, '\D', '', 'g')
  end,
  case
    when p.phone is null or length(regexp_replace(p.phone, '\D', '', 'g')) = 0 then ''
    when length(regexp_replace(p.phone, '\D', '', 'g')) = 10
      then '+91' || regexp_replace(p.phone, '\D', '', 'g')
    else '+' || regexp_replace(p.phone, '\D', '', 'g')
  end,
  case
    when p.phone is null or length(regexp_replace(p.phone, '\D', '', 'g')) = 0 then ''
    when length(regexp_replace(p.phone, '\D', '', 'g')) = 10
      then '91' || regexp_replace(p.phone, '\D', '', 'g')
    else regexp_replace(p.phone, '\D', '', 'g')
  end,
  p.email,
  p.photo_url,
  'steel',
  'active'
from public.admin_profiles p
where not exists (
  select 1 from public.digital_cards c where c.admin_profile_id = p.id
)
on conflict (slug) do nothing;

-- Prefer stable slugs for known advisors when those admin profiles exist
update public.digital_cards c
set
  slug = 'parth-patel',
  display_name = 'Parth Patel',
  first_name = 'Parth',
  last_name = 'Patel',
  role_title = 'Property Advisor',
  tagline = 'Private guidance for homes that feel like the right beginning.',
  phone_display = '+91 76002 71405',
  phone_tel = '+917600271405',
  whatsapp = '917600271405',
  accent = 'steel',
  cover_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
  status = 'active'
from public.admin_profiles p
where c.admin_profile_id = p.id
  and lower(p.name) like '%parth%patel%'
  and not exists (
    select 1 from public.digital_cards x
    where x.slug = 'parth-patel' and x.id <> c.id
  );

update public.digital_cards c
set
  slug = 'sandeep-gauswami',
  display_name = 'Sandeep Gauswami',
  first_name = 'Sandeep',
  last_name = 'Gauswami',
  role_title = 'Property Advisor',
  tagline = 'Trusted counsel for premium residences — from first call to keys.',
  phone_display = '+91 87807 52792',
  phone_tel = '+918780752792',
  whatsapp = '918780752792',
  accent = 'bronze',
  cover_url = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80',
  status = 'active'
from public.admin_profiles p
where c.admin_profile_id = p.id
  and lower(p.name) like '%sandeep%gauswami%'
  and not exists (
    select 1 from public.digital_cards x
    where x.slug = 'sandeep-gauswami' and x.id <> c.id
  );
