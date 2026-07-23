-- Area (and other static_options) cover image support
alter table public.static_options
  add column if not exists image_url text,
  add column if not exists cloudinary_public_id text;
