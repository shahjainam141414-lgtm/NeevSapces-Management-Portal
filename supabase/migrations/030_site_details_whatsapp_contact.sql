-- ============================================================
-- Align live site_details with WhatsApp number + info@ email
-- Run in Supabase → SQL Editor (Dev + Prod) after 029
-- ============================================================

alter table public.site_details
  alter column phone_display set default '+91 76002 71405',
  alter column phone_tel set default '+917600271405',
  alter column email set default 'info@neevspaces.com';

update public.site_details
set
  phone_display = '+91 76002 71405',
  phone_tel = '+917600271405'
where id = 1
  and phone_display = '+91 98240 74454';

update public.site_details
set email = 'info@neevspaces.com'
where id = 1
  and email = 'hello@neevspaces.com';
