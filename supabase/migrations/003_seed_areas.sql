-- Optional seed for Areas (same static_options table, type = 'area')
-- Run in Supabase → SQL Editor if you want starter rows

insert into public.static_options (type, value, status) values
  ('area', 'SG Highway', 'active'),
  ('area', 'Science City', 'active'),
  ('area', 'Sindhu Bhavan', 'active'),
  ('area', 'Bopal', 'inactive')
on conflict (type, value) do nothing;
