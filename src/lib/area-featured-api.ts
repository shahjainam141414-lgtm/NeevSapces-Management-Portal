import { createClient } from "@/lib/supabase/client";

function toFriendlyError(error: { message?: string; code?: string; hint?: string }) {
  const msg = error.message ?? "Supabase request failed";
  if (
    msg.toLowerCase().includes("area_featured_properties") ||
    msg.toLowerCase().includes("schema cache")
  ) {
    return new Error(
      "Area featured table missing. Run supabase/migrations/035_area_featured_properties.sql in Supabase, then retry.",
    );
  }
  return new Error(error.hint ? `${msg} (${error.hint})` : msg);
}

export async function listAreaFeaturedPropertyIds(
  areaId: string,
): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("area_featured_properties")
    .select("property_id, sort_order")
    .eq("area_id", areaId)
    .order("sort_order", { ascending: true });

  if (error) throw toFriendlyError(error);
  return (data ?? []).map((row) => row.property_id as string);
}

/** Counts of featured properties per area (for admin overview). */
export async function listAreaFeaturedCounts(): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("area_featured_properties")
    .select("area_id");

  if (error) throw toFriendlyError(error);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = row.area_id as string;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

/** Replace featured properties for one area (order preserved). */
export async function setAreaFeaturedProperties(
  areaId: string,
  propertyIds: string[],
): Promise<void> {
  const supabase = createClient();
  const unique = [...new Set(propertyIds)];

  const { error: clearError } = await supabase
    .from("area_featured_properties")
    .delete()
    .eq("area_id", areaId);

  if (clearError) throw toFriendlyError(clearError);
  if (unique.length === 0) return;

  const rows = unique.map((property_id, index) => ({
    area_id: areaId,
    property_id,
    sort_order: index,
  }));

  const { error: insertError } = await supabase
    .from("area_featured_properties")
    .insert(rows);

  if (insertError) throw toFriendlyError(insertError);
}
