-- Carpet terrace for penthouse floor plans (optional; show on site only when set)
alter table public.property_floor_plans
  add column if not exists carpet_terrace_sqft numeric(12, 2),
  add column if not exists carpet_terrace_sqyd numeric(12, 2);
