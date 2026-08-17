-- Run in NeevSpaces-Dev SQL Editor BEFORE copying production data.
-- Clears seed/empty rows so prod IDs can insert cleanly.

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
  public.amenities,
  public.builders,
  public.static_options,
  public.admin_profiles
restart identity cascade;
