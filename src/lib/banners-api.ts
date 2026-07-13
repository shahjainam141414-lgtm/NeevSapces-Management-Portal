import { createClient } from "@/lib/supabase/client";
import type { SiteBanner } from "@/lib/banners";

export async function getMainBanner(): Promise<SiteBanner | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("site_banners")
    .select("id, slot, image_url, cloudinary_public_id, status, created_at, updated_at")
    .eq("slot", "main")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as SiteBanner | null) ?? null;
}

export async function upsertMainBanner(input: {
  image_url: string;
  cloudinary_public_id?: string | null;
}): Promise<SiteBanner> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("site_banners")
    .upsert(
      {
        slot: "main",
        image_url: input.image_url,
        cloudinary_public_id: input.cloudinary_public_id ?? null,
        status: "active",
      },
      { onConflict: "slot" },
    )
    .select("id, slot, image_url, cloudinary_public_id, status, created_at, updated_at")
    .single();

  if (error) throw new Error(error.message);
  return data as SiteBanner;
}

export async function clearMainBanner(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("site_banners")
    .delete()
    .eq("slot", "main");

  if (error) throw new Error(error.message);
}
