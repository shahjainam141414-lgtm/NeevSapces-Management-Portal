-- Default tagline for digital cards
alter table public.digital_cards
  alter column tagline set default 'Create your legacy with strong neev';

-- Refresh cards still on the old default tagline
update public.digital_cards
set tagline = 'Create your legacy with strong neev'
where tagline = 'Private guidance for homes that feel like the right beginning.';
