-- Carpet area for floor plans (super built-up remains area_sqft / area_sqyd)
alter table public.property_floor_plans
  add column if not exists carpet_area_sqft numeric(12, 2),
  add column if not exists carpet_area_sqyd numeric(12, 2);
