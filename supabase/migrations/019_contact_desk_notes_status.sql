-- ============================================================
-- Contact desk: CRM statuses + notes
-- Run in Supabase → SQL Editor
-- Safe to re-run. Also creates base tables if 018 was never applied.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Contact enquiries (base table)
-- ------------------------------------------------------------
create table if not exists public.contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  message text not null,
  source text not null default 'contact_page',
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists contact_enquiries_created_at_idx
  on public.contact_enquiries (created_at desc);
create index if not exists contact_enquiries_status_idx
  on public.contact_enquiries (status);

-- Migrate legacy status values
update public.contact_enquiries
set status = 'connected'
where status = 'contacted';

-- Widen status check for CRM follow-up flow
alter table public.contact_enquiries
  drop constraint if exists contact_enquiries_status_check;

alter table public.contact_enquiries
  add constraint contact_enquiries_status_check
  check (
    status in (
      'new',
      'attempting',
      'connected',
      'recall_done',
      'not_reachable',
      'closed'
    )
  );

-- ------------------------------------------------------------
-- Notes on each enquiry (admin follow-ups)
-- ------------------------------------------------------------
create table if not exists public.contact_enquiry_notes (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null
    references public.contact_enquiries (id) on delete cascade,
  note text not null,
  created_by_name text,
  created_by_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists contact_enquiry_notes_enquiry_id_idx
  on public.contact_enquiry_notes (enquiry_id, created_at desc);

-- ------------------------------------------------------------
-- Browse unlocks (from 018 — create if missing)
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
-- Private — service_role only
-- ------------------------------------------------------------
revoke all on table public.contact_enquiries from anon, authenticated;
revoke all on table public.contact_enquiry_notes from anon, authenticated;
revoke all on table public.browse_unlocks from anon, authenticated;

grant all on table public.contact_enquiries to service_role;
grant all on table public.contact_enquiry_notes to service_role;
grant all on table public.browse_unlocks to service_role;

alter table public.contact_enquiries enable row level security;
alter table public.contact_enquiry_notes enable row level security;
alter table public.browse_unlocks enable row level security;
