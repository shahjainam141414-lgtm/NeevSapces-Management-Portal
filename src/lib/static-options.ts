export const STATIC_OPTION_TYPES = [
  "area",
  "project",
  "builder",
  "amenity",
  "property_type",
  "category",
] as const;

export type StaticOptionType = (typeof STATIC_OPTION_TYPES)[number];

export type OptionStatus = "active" | "inactive";

export type StaticOption = {
  id: string;
  type: StaticOptionType;
  value: string;
  status: OptionStatus;
  image_url?: string | null;
  cloudinary_public_id?: string | null;
  nearby_area_ids?: string[] | null;
  created_at?: string;
  updated_at?: string;
};

/** UI-friendly shape used by customization tables */
export type EntityItem = {
  id: string;
  name: string;
  status: OptionStatus;
  image_url?: string | null;
  cloudinary_public_id?: string | null;
  nearby_area_ids?: string[];
};

export function toEntityItem(row: StaticOption): EntityItem {
  return {
    id: row.id,
    name: row.value,
    status: row.status,
    image_url: row.image_url ?? null,
    cloudinary_public_id: row.cloudinary_public_id ?? null,
    nearby_area_ids: Array.isArray(row.nearby_area_ids)
      ? row.nearby_area_ids.filter(Boolean)
      : [],
  };
}
