import type { PriceUnit } from "@/lib/pricing";
import {
  buildPriceRangeLabel,
  formatCardPrice,
  parsePriceLabel,
  toLac,
} from "@/lib/pricing";

export type PropertyRateCard = {
  id: string;
  title: string;
  /** Formatted label for website/list cards, e.g. "1.3 Cr.*" */
  price: string;
  notes: string;
  /** Structured amount (decimal). Optional for legacy cards. */
  amount?: number | null;
  /** Lac. or Cr. */
  unit?: PriceUnit | null;
};

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
  /** Structured rate cards; legacy price columns stay in sync for list cards */
  rate_cards: PropertyRateCard[];

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
  label: string | null;
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
  "id, title, slug, status, is_featured, listing_badge, area_id, area_name, locality, city, pincode, full_address, cover_image_url, cover_cloudinary_public_id, brochure_url, package_price_label, package_price_notes, price_per_sqft_label, rate_cards, availability, possession_by, property_type_label, tower_count, unit_count, rera_no, rera_url, builder_id, developer_name, category_label, construction_status, project_size_label, floor_count, total_plot_area, open_area_percent, parking_types, facing, project_position, road_connectivity, current_status, about, sort_order, created_at, updated_at";

export function normalizeRateCards(value: unknown): PropertyRateCard[] {
  if (!Array.isArray(value)) return [];
  const cards = value
    .map((item, index) => {
      const row = item as Partial<PropertyRateCard> & {
        amount?: unknown;
        unit?: unknown;
      };
      let amount =
        typeof row.amount === "number" && Number.isFinite(row.amount)
          ? row.amount
          : null;
      let unit: PriceUnit | null =
        row.unit === "lac" || row.unit === "cr" ? row.unit : null;
      let price = typeof row.price === "string" ? row.price : "";

      // Backfill structured fields from legacy free-text price
      if ((amount == null || !unit) && price) {
        const parsed = parsePriceLabel(price);
        if (parsed) {
          amount = parsed.amount;
          unit = parsed.unit;
        }
      }
      // Keep price string in sync when structured values exist
      if (amount != null && unit) {
        price = formatCardPrice(amount, unit);
      }

      return {
        id:
          typeof row.id === "string" && row.id
            ? row.id
            : `card-${index}-${Date.now()}`,
        title: typeof row.title === "string" ? row.title : "",
        price,
        notes: typeof row.notes === "string" ? row.notes : "",
        amount,
        unit,
      };
    })
    .filter(
      (c) =>
        c.title.trim() ||
        c.price.trim() ||
        c.notes.trim() ||
        (c.amount != null && c.amount > 0),
    );

  // Auto-arrange: price ascending (Lac-equivalent), then title A→Z
  return [...cards].sort((a, b) => {
    const lacA =
      a.amount != null && a.unit ? toLac(a.amount, a.unit) : null;
    const lacB =
      b.amount != null && b.unit ? toLac(b.amount, b.unit) : null;
    if (lacA != null && lacB != null && Math.abs(lacA - lacB) > 0.0001) {
      return lacA - lacB;
    }
    if (lacA != null && lacB == null) return -1;
    if (lacA == null && lacB != null) return 1;
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
}

/** Cards that contribute to the package price range (exclude per-sqft style). */
export function packagePriceCards(cards: PropertyRateCard[]): PropertyRateCard[] {
  return cards.filter((c) => {
    if (/sq\.?\s*ft|sqft|per\s*sq/i.test(c.title)) return false;
    return c.amount != null && c.unit != null && c.amount > 0;
  });
}

export function autoPriceRangeFromCards(cards: PropertyRateCard[]): string {
  return buildPriceRangeLabel(packagePriceCards(cards));
}

/** Derive legacy flat price columns from structured rate cards. */
export function deriveLegacyPricesFromRateCards(cards: PropertyRateCard[]) {
  const cleaned = cards.filter(
    (c) =>
      c.title.trim() ||
      c.price.trim() ||
      c.notes.trim() ||
      (c.amount != null && c.amount > 0),
  );
  const packageCards = packagePriceCards(cleaned);
  const range = buildPriceRangeLabel(packageCards);
  const first = packageCards[0] ?? cleaned[0];
  const sqft =
    cleaned.find((c) => /sq\.?\s*ft|sqft|per\s*sq/i.test(c.title)) ?? null;

  return {
    // Listing hero price = auto range when possible, else first card label
    package_price_label: range || first?.price.trim() || null,
    package_price_notes: first?.notes.trim() || null,
    price_per_sqft_label: sqft?.price.trim() || null,
  };
}

/** Seed rate cards from legacy columns when JSON is empty. */
export function seedRateCardsFromLegacy(prop: {
  rate_cards?: unknown;
  package_price_label?: string | null;
  package_price_notes?: string | null;
  price_per_sqft_label?: string | null;
}): PropertyRateCard[] {
  const existing = normalizeRateCards(prop.rate_cards);
  if (existing.length > 0) return existing;

  const cards: PropertyRateCard[] = [];
  if (prop.package_price_label || prop.package_price_notes) {
    const parsed = parsePriceLabel(prop.package_price_label ?? "");
    cards.push({
      id: crypto.randomUUID(),
      title: "Package price",
      price: prop.package_price_label ?? "",
      notes: prop.package_price_notes ?? "",
      amount: parsed?.amount ?? null,
      unit: parsed?.unit ?? null,
    });
  }
  if (prop.price_per_sqft_label) {
    cards.push({
      id: crypto.randomUUID(),
      title: "Price per sq.ft.",
      price: prop.price_per_sqft_label,
      notes: "",
      amount: null,
      unit: null,
    });
  }
  return cards;
}

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

// Badge shown on listing cards. Curated from 99acres & gandhinagarproperty.com.
export const LISTING_BADGE_OPTIONS = [
  "For Sale",
  "For Rent",
  "New Launch",
  "Newly Launched",
  "Ready to Move",
  "Under Construction",
  "Resale",
  "Featured",
  "Sold Out",
  "Coming Soon",
] as const;

// Live availability state of the project.
export const CURRENT_STATUS_OPTIONS = [
  "Available",
  "Limited Availability",
  "Few Units Left",
  "Sold Out",
  "Coming Soon",
  "Newly Launched",
] as const;

export function statusBadgeVariant(
  status: PropertyStatus,
): "success" | "warning" | "secondary" {
  if (status === "active") return "success";
  if (status === "draft") return "warning";
  return "secondary";
}
