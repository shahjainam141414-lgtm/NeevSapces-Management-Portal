-- Nearby areas for area static options (admin-only for now)
alter table public.static_options
  add column if not exists nearby_area_ids uuid[] not null default '{}';

comment on column public.static_options.nearby_area_ids is
  'For type=area: related nearby area IDs (other static_options rows).';
