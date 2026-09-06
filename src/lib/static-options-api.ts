import { createClient } from "@/lib/supabase/client";
import {
  toEntityItem,
  type EntityItem,
  type OptionStatus,
  type StaticOption,
  type StaticOptionType,
} from "@/lib/static-options";

const OPTION_COLUMNS =
  "id, type, value, status, image_url, cloudinary_public_id, nearby_area_ids, created_at, updated_at";

function toFriendlyError(error: {
  message?: string;
  code?: string;
  hint?: string;
}) {
  const msg = error.message ?? "Supabase request failed";
  if (
    error.code === "42501" ||
    msg.toLowerCase().includes("permission") ||
    msg.toLowerCase().includes("policy")
  ) {
    return new Error(
      "Supabase permission denied on static_options. Run supabase/migrations/002_fix_static_options_grants.sql in the SQL Editor, then retry.",
    );
  }
  if (
    msg.toLowerCase().includes("image_url") ||
    msg.toLowerCase().includes("cloudinary_public_id")
  ) {
    return new Error(
      "Area image columns missing. Run supabase/migrations/016_static_options_image.sql in Supabase, then retry.",
    );
  }
  if (msg.toLowerCase().includes("nearby_area_ids")) {
    return new Error(
      "Nearby areas column missing. Run supabase/migrations/034_static_options_nearby_area_ids.sql in Supabase, then retry.",
    );
  }
  return new Error(error.hint ? `${msg} (${error.hint})` : msg);
}

function cleanNearbyIds(ids: string[] | undefined, excludeId?: string) {
  if (!ids?.length) return [];
  const unique = [...new Set(ids.filter(Boolean))];
  return excludeId ? unique.filter((id) => id !== excludeId) : unique;
}

export async function listStaticOptions(
  type: StaticOptionType,
): Promise<EntityItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("static_options")
    .select(OPTION_COLUMNS)
    .eq("type", type)
    .order("value", { ascending: true });

  if (error) throw toFriendlyError(error);
  return ((data ?? []) as StaticOption[]).map(toEntityItem);
}

export async function createStaticOption(input: {
  type: StaticOptionType;
  value: string;
  status: OptionStatus;
  image_url?: string | null;
  cloudinary_public_id?: string | null;
  nearby_area_ids?: string[];
}): Promise<EntityItem> {
  const supabase = createClient();
  const payload: Record<string, unknown> = {
    type: input.type,
    value: input.value.trim(),
    status: input.status,
  };
  if (input.image_url !== undefined) payload.image_url = input.image_url;
  if (input.cloudinary_public_id !== undefined) {
    payload.cloudinary_public_id = input.cloudinary_public_id;
  }
  if (input.nearby_area_ids !== undefined) {
    payload.nearby_area_ids = cleanNearbyIds(input.nearby_area_ids);
  }

  const { data, error } = await supabase
    .from("static_options")
    .insert(payload)
    .select(OPTION_COLUMNS)
    .single();

  if (error) throw toFriendlyError(error);
  return toEntityItem(data as StaticOption);
}

export async function updateStaticOption(input: {
  id: string;
  value: string;
  status: OptionStatus;
  image_url?: string | null;
  cloudinary_public_id?: string | null;
  clearImage?: boolean;
  nearby_area_ids?: string[];
}): Promise<EntityItem> {
  const supabase = createClient();
  const payload: Record<string, unknown> = {
    value: input.value.trim(),
    status: input.status,
  };

  if (input.clearImage) {
    payload.image_url = null;
    payload.cloudinary_public_id = null;
  } else {
    if (input.image_url !== undefined) payload.image_url = input.image_url;
    if (input.cloudinary_public_id !== undefined) {
      payload.cloudinary_public_id = input.cloudinary_public_id;
    }
  }

  if (input.nearby_area_ids !== undefined) {
    payload.nearby_area_ids = cleanNearbyIds(input.nearby_area_ids, input.id);
  }

  const { data, error } = await supabase
    .from("static_options")
    .update(payload)
    .eq("id", input.id)
    .select(OPTION_COLUMNS)
    .single();

  if (error) throw toFriendlyError(error);
  return toEntityItem(data as StaticOption);
}

export async function deleteStaticOption(id: string): Promise<void> {
  const supabase = createClient();

  // Drop this area from other areas' nearby lists before deleting.
  const { data: linked, error: linkedError } = await supabase
    .from("static_options")
    .select("id, nearby_area_ids")
    .eq("type", "area")
    .contains("nearby_area_ids", [id]);

  if (linkedError) throw toFriendlyError(linkedError);

  for (const row of linked ?? []) {
    const next = cleanNearbyIds(
      (row.nearby_area_ids as string[] | null) ?? [],
      id,
    ).filter((x) => x !== id);
    const { error: updateError } = await supabase
      .from("static_options")
      .update({ nearby_area_ids: next })
      .eq("id", row.id);
    if (updateError) throw toFriendlyError(updateError);
  }

  const { error } = await supabase
    .from("static_options")
    .delete()
    .eq("id", id);

  if (error) throw toFriendlyError(error);
}
