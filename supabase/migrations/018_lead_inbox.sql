-- ============================================================
-- Lead inbox: contact enquiries + browse unlocks
-- Run in Supabase → SQL Editor (after 017)
-- Written from website via service_role; read from admin via service_role.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Contact desk — submissions from /contact
-- ------------------------------------------------------------
create table if not exists public.contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  message text not null,
  source text not null default 'contact_page',
  status text not null default 'new'
    check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists contact_enquiries_created_at_idx
  on public.contact_enquiries (created_at desc);
create index if not exists contact_enquiries_status_idx
  on public.contact_enquiries (status);

-- ------------------------------------------------------------
-- Browse unlocks — visitors who signed in to see more listings
-- (hit free-view gate, then verified phone)
-- ------------------------------------------------------------
create table if not exists public.browse_unlocks (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  name text,
  email text,
  intent_path text,
  viewed_slugs text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists browse_unlocks_created_at_idx
  on public.browse_unlocks (created_at desc);
create index if not exists browse_unlocks_phone_idx
  on public.browse_unlocks (phone);

-- ------------------------------------------------------------
-- Private tables — service_role only (same pattern as site_users)
-- ------------------------------------------------------------
revoke all on table public.contact_enquiries from anon, authenticated;
revoke all on table public.browse_unlocks from anon, authenticated;

alter table public.contact_enquiries enable row level security;
alter table public.browse_unlocks enable row level security;
