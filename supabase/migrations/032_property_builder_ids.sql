-- Multiple builders per property. builder_id stays as the primary (first) brand.
alter table public.properties
  add column if not exists builder_ids uuid[] not null default '{}';

update public.properties
set builder_ids = array[builder_id]
where builder_id is not null
  and cardinality(coalesce(builder_ids, '{}')) = 0;

create index if not exists properties_builder_ids_gin_idx
  on public.properties using gin (builder_ids);
