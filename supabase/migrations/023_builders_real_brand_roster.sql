-- ============================================================
-- Real brand roster + original logo paths (local /builders/*)
-- Prefer uploading HQ originals to Cloudinary via Admin in prod.
-- Run in Supabase → SQL Editor after deploying logo files.
-- ============================================================

-- 0) Normalize older alias names onto the final roster names
--    (skip if the target name already exists to avoid unique conflicts)

do $$
begin
  if exists (select 1 from public.builders where name = 'Sangath IPL')
     and not exists (select 1 from public.builders where name = 'Sangath Pro') then
    update public.builders
    set name = 'Sangath Pro', updated_at = now()
    where name = 'Sangath IPL';
  end if;

  if exists (select 1 from public.builders where name = 'Kavyaratna')
     and not exists (select 1 from public.builders where name = 'Kaavyaratna Group') then
    update public.builders
    set name = 'Kaavyaratna Group', updated_at = now()
    where name = 'Kavyaratna';
  end if;

  if exists (select 1 from public.builders where name = 'Kavyaratna Group')
     and not exists (select 1 from public.builders where name = 'Kaavyaratna Group') then
    update public.builders
    set name = 'Kaavyaratna Group', updated_at = now()
    where name = 'Kavyaratna Group';
  end if;

  if exists (select 1 from public.builders where name = 'Pravish')
     and not exists (select 1 from public.builders where name = 'Pravish Group') then
    update public.builders
    set name = 'Pravish Group', updated_at = now()
    where name = 'Pravish';
  end if;

  if exists (select 1 from public.builders where name = 'Reneev')
     and not exists (select 1 from public.builders where name = 'Reneev Developers') then
    update public.builders
    set name = 'Reneev Developers', updated_at = now()
    where name = 'Reneev';
  end if;
end $$;

-- Soft-drop leftover alias rows if both old + new exist
update public.builders
set status = 'inactive', updated_at = now()
where name in ('Sangath IPL', 'Sangath', 'Kavyaratna', 'Kavyaratna Group', 'Pravish', 'Reneev');

-- 1) Upsert the active brand list with original logo files
with roster(name, website, logo_url, sort_order) as (
  values
    ('Shivalik Group',       'https://shivalikgroup.com',           '/builders/shivalik.svg',            1),
    ('Shilp Group',          'https://shilpgroup.com',              '/builders/shilp.jpg',               2),
    ('Sobha Limited',        'https://www.sobha.com',               '/builders/sobha.png',               3),
    ('Trogon Group',         'https://trogongroup.com',             '/builders/trogon.svg',              4),
    ('Gala Infrastructure',  'https://galainfra.com',               '/builders/gala.png',                5),
    ('HN Safal',             'https://www.hnsafal.com',             '/builders/hn-safal.png',            6),
    ('B Safal',              'https://bsafal.com',                  '/builders/b-safal.png',             7),
    ('Swati Procon',         'https://www.swatiprocon.com',         '/builders/swati.png',               8),
    ('Savvy Group',          'https://savvygroup.in',               '/builders/savvy.png',               9),
    ('Sangath Pro',          'https://sangathpro.com',              '/builders/sangath.png',            10),
    ('Ganesh Housing',       'https://www.ganeshhousing.com',       '/builders/ganesh-housing.png',     11),
    ('Tremont Group',        'https://tremontinfra.com',            '/builders/tremont.png',            12),
    ('Pravish Group',        'https://pravishgroup.com',            '/builders/pravish.png',            13),
    ('Rajyash Group',        'https://rajyashgroup.com',            '/builders/rajyash.webp',           14),
    ('Adani Realty',         'https://adanirealty.com',             '/builders/adani.svg',              15),
    ('Addor Group',          'https://addorgroup.com',              '/builders/addor.png',              16),
    ('Aaryan Group',         'https://aaryangroup.com',             '/builders/aaryan.png',             17),
    ('Reneev Developers',    'https://reneevdevelopers.com',        '/builders/reneev.png',             18),
    ('Swagat Group',         'https://www.swagatgroup.in',          '/builders/swagat.svg',             19),
    ('Kaavyaratna Group',    'https://kaavyaratna.com',             '/builders/kavyaratna.png',         20),
    ('Nakshatra Group',      'https://nakshatra-group.com',         '/builders/nakshatra.svg',          21),
    ('Bakeri Group',         'https://bakeri.com',                  '/builders/bakeri.png',             22),
    ('Godrej Properties',    'https://godrejproperties.com',        '/builders/godrej-properties.svg',  23),
    ('Saamarth Group',       'https://saamarthgroup.com',           '/builders/saamarth.png',           24),
    ('Goyal & Co.',          'https://goyalco.com',                 '/builders/goyal-co.png',           25)
)
insert into public.builders as b (name, website, logo_url, status, sort_order, tier)
select r.name, r.website, r.logo_url, 'active', r.sort_order, 1
from roster r
on conflict (name) do update
set
  website = excluded.website,
  logo_url = excluded.logo_url,
  status = 'active',
  sort_order = excluded.sort_order,
  updated_at = now();

-- 2) Soft-deactivate brands not in the new roster (keep FK links intact)
update public.builders
set status = 'inactive', updated_at = now()
where name not in (
  'Shivalik Group',
  'Shilp Group',
  'Sobha Limited',
  'Trogon Group',
  'Gala Infrastructure',
  'HN Safal',
  'B Safal',
  'Swati Procon',
  'Savvy Group',
  'Sangath Pro',
  'Ganesh Housing',
  'Tremont Group',
  'Pravish Group',
  'Rajyash Group',
  'Adani Realty',
  'Addor Group',
  'Aaryan Group',
  'Reneev Developers',
  'Swagat Group',
  'Kaavyaratna Group',
  'Nakshatra Group',
  'Bakeri Group',
  'Godrej Properties',
  'Saamarth Group',
  'Goyal & Co.'
);
