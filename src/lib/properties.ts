export type PropertyStatus = "draft" | "active" | "inactive";

export type Property = {
  id: string;
  title: string;
  slug: string;
  status: PropertyStatus;
  is_featured: boolean;
  listing_badge: string;

  area_id: string | null;
  area_name: string | null;
  locality: string | null;
  city: string;
  pincode: string | null;
  full_address: string | null;

  cover_image_url: string | null;
  cover_cloudinary_public_id: string | null;
  brochure_url: string | null;

  package_price_label: string | null;
  package_price_notes: string | null;
  price_per_sqft_label: string | null;

  availability: string[];
  possession_by: string | null;
  property_type_label: string | null;
  tower_count: number | null;
  unit_count: number | null;
  rera_no: string | null;
  rera_url: string | null;

  builder_id: string | null;
  developer_name: string | null;
  category_label: string | null;
  construction_status: string | null;

  project_size_label: string | null;
  floor_count: number | null;
  total_plot_area: string | null;
  open_area_percent: number | null;
  parking_types: string[];
  facing: string | null;
  project_position: string | null;
  road_connectivity: string | null;
  current_status: string | null;

  about: string | null;

  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type PropertyMedia = {
  id: string;
  property_id: string;
  image_url: string;
  cloudinary_public_id: string | null;
  caption: string | null;
  sort_order: number;
};

export type PropertyFloorPlan = {
  id: string;
  property_id: string;
  name: string;
  bhk_label: string | null;
  rooms: number | null;
  balcony: number | null;
  bathroom: number | null;
  servant_room: number | null;
  area_sqft: number | null;
  area_sqyd: number | null;
  area_sqmt: number | null;
  price_label: string | null;
  image_url: string | null;
  cloudinary_public_id: string | null;
  sort_order: number;
};

export type PropertyHighlight = {
  id: string;
  property_id: string;
  content: string;
  sort_order: number;
};

export type PropertySpec = {
  id: string;
  property_id: string;
  content: string;
  sort_order: number;
};

export type PropertyFaq = {
  id: string;
  property_id: string;
  question: string;
  answer: string;
  sort_order: number;
};

export type PropertyDetail = Property & {
  media: PropertyMedia[];
  floor_plans: PropertyFloorPlan[];
  amenity_ids: string[];
  highlights: PropertyHighlight[];
  specs: PropertySpec[];
  faqs: PropertyFaq[];
  builder_name?: string | null;
};

export const PROPERTY_COLUMNS =
  "id, title, slug, status, is_featured, listing_badge, area_id, area_name, locality, city, pincode, full_address, cover_image_url, cover_cloudinary_public_id, brochure_url, package_price_label, package_price_notes, price_per_sqft_label, availability, possession_by, property_type_label, tower_count, unit_count, rera_no, rera_url, builder_id, developer_name, category_label, construction_status, project_size_label, floor_count, total_plot_area, open_area_percent, parking_types, facing, project_position, road_connectivity, current_status, about, sort_order, created_at, updated_at";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildPropertySlug(title: string, areaName?: string | null): string {
  const base = slugify(title);
  const area = areaName ? slugify(areaName) : "";
  if (!area) return base || "property";
  if (base.includes(area)) return base;
  return `${base}-at-${area}` || "property";
}

export const AVAILABILITY_OPTIONS = [
  "2 BHK",
  "3 BHK",
  "4 BHK",
  "5 BHK",
  "Penthouse",
  "Villa & Bungalow",
  "Shop",
  "Office",
  "Showroom",
] as const;

export const PARKING_OPTIONS = [
  "4 Wheeler Parking",
  "2 Wheeler Parking",
  "Covered Parking",
  "Basement",
  "Open Parking",
] as const;

export const CONSTRUCTION_STATUS_OPTIONS = [
  "Under Construction",
  "Ready Possession",
  "Ongoing",
  "Upcoming",
] as const;

export function statusBadgeVariant(
  status: PropertyStatus,
): "success" | "warning" | "secondary" {
  if (status === "active") return "success";
  if (status === "draft") return "warning";
  return "secondary";
}
