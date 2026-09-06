-- ============================================================
-- Clone NeevSpaces → NeevSpaces-Dev
--
-- Step 1: Run this WHOLE file in NeevSpaces-Dev SQL Editor
--          (clears Dev so prod data can load cleanly)
--
-- Step 2: Neon → NeevSpaces → project menu → Export / dump
--          then Import that dump into NeevSpaces-Dev
--
-- OR use the one-liner script: scripts/clone-db.ps1
-- ============================================================

truncate table
  public.property_faqs,
  public.property_specs,
  public.property_highlights,
  public.property_amenities,
  public.property_floor_plans,
  public.property_media,
  public.properties,
  public.user_likes,
  public.site_users,
  public.contact_enquiry_notes,
  public.contact_enquiries,
  public.browse_unlocks,
  public.digital_cards,
  public.site_banners,
  public.site_details,
  public.amenities,
  public.builders,
  public.static_options,
  public.admin_profiles
restart identity cascade;
