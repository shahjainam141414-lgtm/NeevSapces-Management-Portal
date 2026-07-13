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
  created_at?: string;
  updated_at?: string;
};

/** UI-friendly shape used by customization tables */
export type EntityItem = {
  id: string;
  name: string;
  status: OptionStatus;
};

export function toEntityItem(row: StaticOption): EntityItem {
  return {
    id: row.id,
    name: row.value,
    status: row.status,
  };
}
