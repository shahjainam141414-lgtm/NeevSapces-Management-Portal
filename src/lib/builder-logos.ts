/**
 * Builder logos storage:
 * 1) Upload original logo → Cloudinary (`neev/builders`)
 * 2) Save `logo_url` + `cloudinary_public_id` on Supabase `builders` row
 *
 * Display order: Cloudinary URL from DB first, then any other saved URL.
 */

export function resolveBuilderLogo(
  _name: string,
  logoUrl?: string | null,
): string | null {
  if (!logoUrl) return null;

  // Primary: Cloudinary originals stored from Add/Edit upload
  if (logoUrl.includes("res.cloudinary.com")) return logoUrl;

  // Ignore broken remote logo CDNs
  if (
    logoUrl.includes("logo.clearbit.com") ||
    logoUrl.includes("google.com/s2/favicons")
  ) {
    return null;
  }

  // Allow temporary local paths during migration
  if (logoUrl.startsWith("/builders/")) return logoUrl;

  if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) {
    return logoUrl;
  }

  return null;
}
