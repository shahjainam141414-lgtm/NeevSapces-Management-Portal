import { createClient } from "@/lib/supabase/client";
import type { Amenity, AmenityStatus } from "@/lib/amenities";

const AMENITY_COLUMNS =
  "id, title, icon_url, cloudinary_public_id, icon_key, status, is_default, sort_order, created_at, updated_at";

export async function listAmenities(): Promise<Amenity[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("amenities")
    .select(AMENITY_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as Amenity[]).map((row) => ({
    ...row,
    is_default: Boolean(row.is_default),
  }));
}

export async function createAmenity(input: {
  title: string;
  status: AmenityStatus;
  is_default?: boolean;
  icon_url?: string | null;
  cloudinary_public_id?: string | null;
  icon_key?: string | null;
}): Promise<Amenity> {
  const supabase = createClient();
  const { data: maxRow } = await supabase
    .from("amenities")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (maxRow?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("amenities")
    .insert({
      title: input.title.trim(),
      status: input.status,
      is_default: input.is_default ?? false,
      icon_url: input.icon_url ?? null,
      cloudinary_public_id: input.cloudinary_public_id ?? null,
      icon_key: input.icon_key ?? "sparkles",
      sort_order,
    })
    .select(AMENITY_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return { ...(data as Amenity), is_default: Boolean(data.is_default) };
}

export async function updateAmenity(input: {
  id: string;
  title: string;
  status: AmenityStatus;
  is_default?: boolean;
  icon_url?: string | null;
  cloudinary_public_id?: string | null;
  clearIcon?: boolean;
}): Promise<Amenity> {
  const supabase = createClient();
  const payload: Record<string, unknown> = {
    title: input.title.trim(),
    status: input.status,
  };

  if (input.is_default !== undefined) {
    payload.is_default = input.is_default;
  }

  if (input.clearIcon) {
    payload.icon_url = null;
    payload.cloudinary_public_id = null;
  } else if (input.icon_url !== undefined) {
    payload.icon_url = input.icon_url;
    payload.cloudinary_public_id = input.cloudinary_public_id ?? null;
  }

  const { data, error } = await supabase
    .from("amenities")
    .update(payload)
    .eq("id", input.id)
    .select(AMENITY_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return { ...(data as Amenity), is_default: Boolean(data.is_default) };
}

export async function setAmenitiesDefault(
  ids: string[],
  isDefault: boolean,
): Promise<Amenity[]> {
  if (ids.length === 0) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("amenities")
    .update({ is_default: isDefault })
    .in("id", ids)
    .select(AMENITY_COLUMNS);

  if (error) throw new Error(error.message);
  return ((data ?? []) as Amenity[]).map((row) => ({
    ...row,
    is_default: Boolean(row.is_default),
  }));
}

export async function deleteAmenity(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("amenities").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
