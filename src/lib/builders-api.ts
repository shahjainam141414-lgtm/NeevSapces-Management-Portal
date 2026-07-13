import { createClient } from "@/lib/supabase/client";
import type { Builder, BuilderStatus, BuilderTier } from "@/lib/builders";

export async function listBuilders(): Promise<Builder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("builders")
    .select(
      "id, name, tier, logo_url, cloudinary_public_id, website, status, sort_order, created_at, updated_at",
    )
    .order("tier", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Builder[];
}

export async function createBuilder(input: {
  name: string;
  tier: BuilderTier;
  status: BuilderStatus;
  website?: string | null;
  logo_url?: string | null;
  cloudinary_public_id?: string | null;
}): Promise<Builder> {
  const supabase = createClient();
  const { data: maxRow } = await supabase
    .from("builders")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("builders")
    .insert({
      name: input.name.trim(),
      tier: input.tier,
      status: input.status,
      website: input.website?.trim() || null,
      logo_url: input.logo_url ?? null,
      cloudinary_public_id: input.cloudinary_public_id ?? null,
      sort_order: (maxRow?.sort_order ?? 0) + 1,
    })
    .select(
      "id, name, tier, logo_url, cloudinary_public_id, website, status, sort_order, created_at, updated_at",
    )
    .single();

  if (error) throw new Error(error.message);
  return data as Builder;
}

export async function updateBuilder(input: {
  id: string;
  name: string;
  tier: BuilderTier;
  status: BuilderStatus;
  website?: string | null;
  logo_url?: string | null;
  cloudinary_public_id?: string | null;
  clearLogo?: boolean;
}): Promise<Builder> {
  const supabase = createClient();
  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    tier: input.tier,
    status: input.status,
    website: input.website?.trim() || null,
  };

  if (input.clearLogo) {
    payload.logo_url = null;
    payload.cloudinary_public_id = null;
  } else if (input.logo_url !== undefined) {
    payload.logo_url = input.logo_url;
    payload.cloudinary_public_id = input.cloudinary_public_id ?? null;
  }

  const { data, error } = await supabase
    .from("builders")
    .update(payload)
    .eq("id", input.id)
    .select(
      "id, name, tier, logo_url, cloudinary_public_id, website, status, sort_order, created_at, updated_at",
    )
    .single();

  if (error) throw new Error(error.message);
  return data as Builder;
}

export async function deleteBuilder(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("builders").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
