export type BuilderStatus = "active" | "inactive";
export type BuilderTier = 1 | 2 | 3;

export type Builder = {
  id: string;
  name: string;
  tier: BuilderTier;
  logo_url: string | null;
  cloudinary_public_id: string | null;
  website: string | null;
  status: BuilderStatus;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export const BUILDER_TIER_META: Record<
  BuilderTier,
  { label: string; description: string }
> = {
  1: {
    label: "Tier 1",
    description: "Most Popular & Trusted",
  },
  2: {
    label: "Tier 2",
    description: "Very Popular",
  },
  3: {
    label: "Tier 3",
    description: "Well Known in Ahmedabad & Gandhinagar",
  },
};

export function getBuilderInitials(name: string) {
  const parts = name
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter((p) => p && !/^(co\.?|group|ipl|ltd\.?|pvt\.?|and)$/i.test(p));

  if (parts.length === 0) return "B";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
