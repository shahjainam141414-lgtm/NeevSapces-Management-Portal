-- ============================================================
-- Contact desk statuses: drop attempting/closed, add recall
-- Run in Supabase → SQL Editor. Safe to re-run.
-- ============================================================

-- Map legacy values before tightening the check
update public.contact_enquiries
set status = 'new'
where status = 'attempting';

update public.contact_enquiries
set status = 'recall'
where status = 'recall_done';

update public.contact_enquiries
set status = 'not_reachable'
where status = 'closed';

alter table public.contact_enquiries
  drop constraint if exists contact_enquiries_status_check;

alter table public.contact_enquiries
  add constraint contact_enquiries_status_check
  check (
    status in (
      'new',
      'connected',
      'recall',
      'not_reachable'
    )
  );
