import { createClient } from "@/lib/supabase/client";
import {
  PROPERTY_COLUMNS,
  buildPropertySlug,
  deriveLegacyPricesFromRateCards,
  normalizeRateCards,
  type Property,
  type PropertyDetail,
  type PropertyFaq,
  type PropertyFloorPlan,
  type PropertyHighlight,
  type PropertyMedia,
  type PropertySpec,
  type PropertyStatus,
} from "@/lib/properties";

function toFriendlyError(error: { message?: string; code?: string; hint?: string }) {
  const msg = error.message ?? "Supabase request failed";
  if (
    msg.toLowerCase().includes("could not find the table") ||
    msg.toLowerCase().includes("schema cache") ||
    error.code === "42P01"
  ) {
    return new Error(
      "Properties tables missing. Run supabase/migrations/013_properties.sql in the Supabase SQL Editor, then retry.",
    );
  }
  if (
    msg.toLowerCase().includes("rate_cards") ||
    msg.toLowerCase().includes("hero_banner") ||
    msg.toLowerCase().includes("is_hero_banner") ||
    (msg.toLowerCase().includes("column") &&
      msg.toLowerCase().includes("does not exist"))
  ) {
    return new Error(
      "Property schema outdated. Run supabase/migrations/015_property_rate_cards_and_spec_labels.sql and 028_property_hero_banners.sql in the Supabase SQL Editor, then retry.",
    );
  }
  if (
    error.code === "42501" ||
    msg.toLowerCase().includes("permission") ||
    msg.toLowerCase().includes("policy")
  ) {
    return new Error(
      "Supabase permission denied on properties. Re-run 013_properties.sql grants/policies, then retry.",
    );
  }
  return new Error(error.hint ? `${msg} (${error.hint})` : msg);
}

function normalizeProperty(row: Property): Property {
  return {
    ...row,
    availability: Array.isArray(row.availability) ? row.availability : [],
    parking_types: Array.isArray(row.parking_types) ? row.parking_types : [],
    rate_cards: normalizeRateCards(row.rate_cards),
    is_featured: Boolean(row.is_featured),
    is_hero_banner: Boolean(row.is_hero_banner),
  };
}

export async function listProperties(): Promise<Property[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(PROPERTY_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) throw toFriendlyError(error);
  return ((data ?? []) as Property[]).map(normalizeProperty);
}

/** Mark the given property IDs as featured (max 8); clear featured on all others. */
export async function setFeaturedProperties(
  propertyIds: string[],
): Promise<void> {
  const supabase = createClient();
  const unique = [...new Set(propertyIds)].slice(0, 8);

  const { error: clearError } = await supabase
    .from("properties")
    .update({ is_featured: false })
    .eq("is_featured", true);

  if (clearError) throw toFriendlyError(clearError);

  if (unique.length === 0) return;

  const { error: setError } = await supabase
    .from("properties")
    .update({ is_featured: true })
    .in("id", unique);

  if (setError) throw toFriendlyError(setError);
}

/** Homepage hero carousel selection. Requires at least one property ID. */
export async function setHeroBannerProperties(
  propertyIds: string[],
): Promise<void> {
  const supabase = createClient();
  const unique = [...new Set(propertyIds)];

  if (unique.length === 0) {
    throw new Error("Select at least one property banner for the homepage.");
  }

  const { error: clearError } = await supabase
    .from("properties")
    .update({ is_hero_banner: false })
    .eq("is_hero_banner", true);

  if (clearError) throw toFriendlyError(clearError);

  const { error: setError } = await supabase
    .from("properties")
    .update({ is_hero_banner: true })
    .in("id", unique);

  if (setError) throw toFriendlyError(setError);
}

export async function getPropertyDetail(id: string): Promise<PropertyDetail> {
  const supabase = createClient();

  const { data: property, error } = await supabase
    .from("properties")
    .select(PROPERTY_COLUMNS)
    .eq("id", id)
    .single();

  if (error) throw toFriendlyError(error);

  const [
    mediaRes,
    plansRes,
    amenitiesRes,
    highlightsRes,
    specsRes,
    faqsRes,
  ] = await Promise.all([
    supabase
      .from("property_media")
      .select("id, property_id, image_url, cloudinary_public_id, caption, sort_order")
      .eq("property_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("property_floor_plans")
      .select(
        "id, property_id, name, bhk_label, rooms, balcony, bathroom, servant_room, carpet_area_sqft, carpet_area_sqyd, area_sqft, area_sqyd, area_sqmt, price_label, image_url, cloudinary_public_id, sort_order",
      )
      .eq("property_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("property_amenities")
      .select("amenity_id, sort_order")
      .eq("property_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("property_highlights")
      .select("id, property_id, content, sort_order")
      .eq("property_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("property_specs")
      .select("id, property_id, label, content, sort_order")
      .eq("property_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("property_faqs")
      .select("id, property_id, question, answer, sort_order")
      .eq("property_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  for (const res of [mediaRes, plansRes, amenitiesRes, highlightsRes, specsRes, faqsRes]) {
    if (res.error) throw toFriendlyError(res.error);
  }

  let builder_name: string | null = null;
  const builderId = (property as Property).builder_id;
  if (builderId) {
    const { data: builder } = await supabase
      .from("builders")
      .select("name")
      .eq("id", builderId)
      .maybeSingle();
    builder_name = builder?.name ?? null;
  }

  return {
    ...normalizeProperty(property as Property),
    media: (mediaRes.data ?? []) as PropertyMedia[],
    floor_plans: (plansRes.data ?? []) as PropertyFloorPlan[],
    amenity_ids: ((amenitiesRes.data ?? []) as { amenity_id: string }[]).map(
      (r) => r.amenity_id,
    ),
    highlights: (highlightsRes.data ?? []) as PropertyHighlight[],
    specs: (specsRes.data ?? []) as PropertySpec[],
    faqs: (faqsRes.data ?? []) as PropertyFaq[],
    builder_name,
  };
}

export type CreatePropertyInput = {
  title: string;
  area_id: string;
  area_name: string;
  locality?: string | null;
  city?: string;
  status?: PropertyStatus;
  property_type_label?: string | null;
  builder_id?: string | null;
  developer_name?: string | null;
};

export async function createProperty(input: CreatePropertyInput): Promise<Property> {
  const supabase = createClient();
  const slug = buildPropertySlug(input.title, input.area_name);

  const { data: maxRow } = await supabase
    .from("properties")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = {
    title: input.title.trim(),
    slug,
    area_id: input.area_id,
    area_name: input.area_name,
    locality: input.locality?.trim() || input.area_name,
    city: input.city?.trim() || "Gandhinagar",
    status: input.status ?? "draft",
    property_type_label: input.property_type_label?.trim() || null,
    builder_id: input.builder_id || null,
    developer_name: input.developer_name?.trim() || null,
    sort_order: (maxRow?.sort_order ?? 0) + 1,
  };

  const { data, error } = await supabase
    .from("properties")
    .insert(payload)
    .select(PROPERTY_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") {
      const uniqueSlug = `${slug}-${Date.now().toString(36)}`;
      const retry = await supabase
        .from("properties")
        .insert({ ...payload, slug: uniqueSlug })
        .select(PROPERTY_COLUMNS)
        .single();
      if (retry.error) throw toFriendlyError(retry.error);
      const created = normalizeProperty(retry.data as Property);
      await attachDefaultAmenities(created.id);
      return created;
    }
    throw toFriendlyError(error);
  }

  const created = normalizeProperty(data as Property);
  await attachDefaultAmenities(created.id);
  return created;
}

export type UpdatePropertyInput = Partial<
  Omit<Property, "id" | "created_at" | "updated_at" | "sort_order">
> & { id: string };

export async function updateProperty(input: UpdatePropertyInput): Promise<Property> {
  const supabase = createClient();
  const { id, ...rest } = input;

  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) payload[key] = value;
  }

  if (typeof payload.title === "string") {
    payload.title = payload.title.trim();
  }
  if (typeof payload.slug === "string") {
    payload.slug = payload.slug.trim();
  }

  if (Array.isArray(payload.rate_cards)) {
    const cards = normalizeRateCards(payload.rate_cards);
    payload.rate_cards = cards;
    const legacy = deriveLegacyPricesFromRateCards(cards);
    if (
      payload.package_price_label === undefined ||
      payload.package_price_label === null ||
      payload.package_price_label === ""
    ) {
      payload.package_price_label = legacy.package_price_label;
    }
    if (payload.package_price_notes === undefined) {
      payload.package_price_notes = legacy.package_price_notes;
    }
    if (payload.price_per_sqft_label === undefined) {
      payload.price_per_sqft_label = legacy.price_per_sqft_label;
    }
  }

  const { data, error } = await supabase
    .from("properties")
    .update(payload)
    .eq("id", id)
    .select(PROPERTY_COLUMNS)
    .single();

  if (error) throw toFriendlyError(error);
  return normalizeProperty(data as Property);
}

export async function deleteProperty(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) throw toFriendlyError(error);
}

// --- Media ---

export async function addPropertyMedia(input: {
  property_id: string;
  image_url: string;
  cloudinary_public_id?: string | null;
  caption?: string | null;
}): Promise<PropertyMedia> {
  const supabase = createClient();
  const { data: maxRow } = await supabase
    .from("property_media")
    .select("sort_order")
    .eq("property_id", input.property_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("property_media")
    .insert({
      property_id: input.property_id,
      image_url: input.image_url,
      cloudinary_public_id: input.cloudinary_public_id ?? null,
      caption: input.caption ?? null,
      sort_order: (maxRow?.sort_order ?? 0) + 1,
    })
    .select("id, property_id, image_url, cloudinary_public_id, caption, sort_order")
    .single();

  if (error) throw toFriendlyError(error);
  return data as PropertyMedia;
}

export async function deletePropertyMedia(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("property_media").delete().eq("id", id);
  if (error) throw toFriendlyError(error);
}

// --- Floor plans ---

export async function upsertFloorPlan(
  input: Omit<PropertyFloorPlan, "id"> & { id?: string },
): Promise<PropertyFloorPlan> {
  const supabase = createClient();
  const payload = {
    property_id: input.property_id,
    name: input.name.trim(),
    bhk_label: input.bhk_label?.trim() || null,
    rooms: input.rooms,
    balcony: input.balcony,
    bathroom: input.bathroom,
    servant_room: input.servant_room,
    carpet_area_sqft: input.carpet_area_sqft,
    carpet_area_sqyd: input.carpet_area_sqyd,
    area_sqft: input.area_sqft,
    area_sqyd: input.area_sqyd,
    area_sqmt: input.area_sqmt,
    price_label: input.price_label?.trim() || null,
    image_url: input.image_url ?? null,
    cloudinary_public_id: input.cloudinary_public_id ?? null,
    sort_order: input.sort_order ?? 0,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("property_floor_plans")
      .update(payload)
      .eq("id", input.id)
      .select(
        "id, property_id, name, bhk_label, rooms, balcony, bathroom, servant_room, carpet_area_sqft, carpet_area_sqyd, area_sqft, area_sqyd, area_sqmt, price_label, image_url, cloudinary_public_id, sort_order",
      )
      .single();
    if (error) throw toFriendlyError(error);
    return data as PropertyFloorPlan;
  }

  const { data: maxRow } = await supabase
    .from("property_floor_plans")
    .select("sort_order")
    .eq("property_id", input.property_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("property_floor_plans")
    .insert({ ...payload, sort_order: (maxRow?.sort_order ?? 0) + 1 })
    .select(
      "id, property_id, name, bhk_label, rooms, balcony, bathroom, servant_room, carpet_area_sqft, carpet_area_sqyd, area_sqft, area_sqyd, area_sqmt, price_label, image_url, cloudinary_public_id, sort_order",
    )
    .single();

  if (error) throw toFriendlyError(error);
  return data as PropertyFloorPlan;
}

export async function deleteFloorPlan(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("property_floor_plans").delete().eq("id", id);
  if (error) throw toFriendlyError(error);
}

// --- Amenities ---

async function attachDefaultAmenities(propertyId: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("amenities")
    .select("id")
    .eq("is_default", true)
    .eq("status", "active")
    .order("sort_order", { ascending: true });

  if (error) throw toFriendlyError(error);

  const ids = ((data ?? []) as { id: string }[]).map((row) => row.id);
  if (ids.length === 0) return;
  await setPropertyAmenities(propertyId, ids);
}

export async function setPropertyAmenities(
  propertyId: string,
  amenityIds: string[],
): Promise<void> {
  const supabase = createClient();
  const { error: delError } = await supabase
    .from("property_amenities")
    .delete()
    .eq("property_id", propertyId);

  if (delError) throw toFriendlyError(delError);

  if (amenityIds.length === 0) return;

  const rows = amenityIds.map((amenity_id, index) => ({
    property_id: propertyId,
    amenity_id,
    sort_order: index + 1,
  }));

  const { error } = await supabase.from("property_amenities").insert(rows);
  if (error) throw toFriendlyError(error);
}

// --- Highlights / Specs / FAQs (replace-all pattern for simplicity) ---

export async function replaceHighlights(
  propertyId: string,
  items: string[],
): Promise<PropertyHighlight[]> {
  const supabase = createClient();
  const { error: delError } = await supabase
    .from("property_highlights")
    .delete()
    .eq("property_id", propertyId);
  if (delError) throw toFriendlyError(delError);

  const cleaned = items.map((c) => c.trim()).filter(Boolean);
  if (cleaned.length === 0) return [];

  const { data, error } = await supabase
    .from("property_highlights")
    .insert(
      cleaned.map((content, index) => ({
        property_id: propertyId,
        content,
        sort_order: index + 1,
      })),
    )
    .select("id, property_id, content, sort_order");

  if (error) throw toFriendlyError(error);
  return (data ?? []) as PropertyHighlight[];
}

export async function replaceSpecs(
  propertyId: string,
  items: { label?: string | null; content: string }[] | string[],
): Promise<PropertySpec[]> {
  const supabase = createClient();
  const { error: delError } = await supabase
    .from("property_specs")
    .delete()
    .eq("property_id", propertyId);
  if (delError) throw toFriendlyError(delError);

  const rows = items
    .map((item) => {
      if (typeof item === "string") {
        return { label: null as string | null, content: item.trim() };
      }
      return {
        label: item.label?.trim() || null,
        content: item.content.trim(),
      };
    })
    .filter((i) => i.content || i.label);

  if (rows.length === 0) return [];

  const { data, error } = await supabase
    .from("property_specs")
    .insert(
      rows.map((item, index) => ({
        property_id: propertyId,
        label: item.label,
        content: item.content || item.label || "",
        sort_order: index + 1,
      })),
    )
    .select("id, property_id, label, content, sort_order");

  if (error) throw toFriendlyError(error);
  return (data ?? []) as PropertySpec[];
}

export async function replaceFaqs(
  propertyId: string,
  items: { question: string; answer: string }[],
): Promise<PropertyFaq[]> {
  const supabase = createClient();
  const { error: delError } = await supabase
    .from("property_faqs")
    .delete()
    .eq("property_id", propertyId);
  if (delError) throw toFriendlyError(delError);

  const cleaned = items
    .map((i) => ({
      question: i.question.trim(),
      answer: i.answer.trim(),
    }))
    .filter((i) => i.question && i.answer);

  if (cleaned.length === 0) return [];

  const { data, error } = await supabase
    .from("property_faqs")
    .insert(
      cleaned.map((item, index) => ({
        property_id: propertyId,
        question: item.question,
        answer: item.answer,
        sort_order: index + 1,
      })),
    )
    .select("id, property_id, question, answer, sort_order");

  if (error) throw toFriendlyError(error);
  return (data ?? []) as PropertyFaq[];
}
