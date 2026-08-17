import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_SITE_DETAILS,
  toPhoneTel,
  type SiteDetails,
} from "@/lib/site-details";

export async function getSiteDetails(): Promise<SiteDetails> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("site_details")
    .select("id, phone_display, phone_tel, email, address, updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    return { id: 1, ...DEFAULT_SITE_DETAILS };
  }
  return data as SiteDetails;
}

export async function saveSiteDetails(input: {
  phone_display: string;
  email: string;
  address: string;
}): Promise<SiteDetails> {
  const supabase = createClient();
  const phone_display = input.phone_display.trim();
  const email = input.email.trim().toLowerCase();
  const address = input.address.trim();
  const phone_tel = toPhoneTel(phone_display);

  const { data, error } = await supabase
    .from("site_details")
    .upsert(
      {
        id: 1,
        phone_display,
        phone_tel,
        email,
        address,
      },
      { onConflict: "id" },
    )
    .select("id, phone_display, phone_tel, email, address, updated_at")
    .single();

  if (error) {
    if (error.message.toLowerCase().includes("site_details")) {
      throw new Error(
        "Site details table is missing. Run supabase/migrations/029_site_details.sql in the Supabase SQL Editor, then retry.",
      );
    }
    throw new Error(error.message);
  }
  return data as SiteDetails;
}
