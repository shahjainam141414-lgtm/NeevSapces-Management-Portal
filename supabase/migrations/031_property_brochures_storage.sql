-- ============================================================
-- Property brochure storage (PDF + images, up to 50MB)
-- Run in Supabase → SQL Editor (Dev + Prod)
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-brochures',
  'property-brochures',
  true,
  52428800,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read property brochures" on storage.objects;
drop policy if exists "Authenticated upload property brochures" on storage.objects;
drop policy if exists "Authenticated update property brochures" on storage.objects;
drop policy if exists "Authenticated delete property brochures" on storage.objects;

create policy "Public read property brochures"
  on storage.objects
  for select
  to public
  using (bucket_id = 'property-brochures');

create policy "Authenticated upload property brochures"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'property-brochures');

create policy "Authenticated update property brochures"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'property-brochures')
  with check (bucket_id = 'property-brochures');

create policy "Authenticated delete property brochures"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'property-brochures');
