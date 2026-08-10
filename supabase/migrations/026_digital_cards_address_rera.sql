-- Editable address + RERA on each digital card (prefilled from company defaults)
alter table public.digital_cards
  add column if not exists office_address text not null default
    'A 707, Ganesh Glory 11, Jagatpura Road, Gota, Ahmedabad 382470';

alter table public.digital_cards
  add column if not exists maps_query text not null default
    'A 707 Ganesh Glory 11 Jagatpura Road Gota Ahmedabad 382470';

alter table public.digital_cards
  add column if not exists rera text not null default
    'AG/GJ/AHMEDABAD/AHMEDABAD CITY/AA06547/180631R1';

update public.digital_cards
set
  office_address = coalesce(nullif(trim(office_address), ''), 'A 707, Ganesh Glory 11, Jagatpura Road, Gota, Ahmedabad 382470'),
  maps_query = coalesce(nullif(trim(maps_query), ''), 'A 707 Ganesh Glory 11 Jagatpura Road Gota Ahmedabad 382470'),
  rera = coalesce(nullif(trim(rera), ''), 'AG/GJ/AHMEDABAD/AHMEDABAD CITY/AA06547/180631R1');
