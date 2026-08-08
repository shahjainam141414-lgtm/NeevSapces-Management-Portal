/**
 * Builder logos storage:
 * 1) Upload original logo → Cloudinary (`neev/builders`)
 * 2) Save `logo_url` + `cloudinary_public_id` on Supabase `builders` row
 *
 * Display order: Cloudinary URL from DB first, then any other saved URL,
 * then local /builders fallback by name.
 */

const LOCAL_BY_NAME: Record<string, string> = {
  "shivalik group": "/builders/shivalik.svg",
  "shilp group": "/builders/shilp.jpg",
  "sobha limited": "/builders/sobha.png",
  "trogon group": "/builders/trogon.svg",
  "gala infrastructure": "/builders/gala.png",
  "hn safal": "/builders/hn-safal.png",
  "b safal": "/builders/b-safal.png",
  "swati procon": "/builders/swati.png",
  "savvy group": "/builders/savvy.png",
  "sangath pro": "/builders/sangath.png",
  "sangath ipl": "/builders/sangath.png",
  "ganesh housing": "/builders/ganesh-housing.png",
  "tremont group": "/builders/tremont.png",
  "pravish group": "/builders/pravish.png",
  "rajyash group": "/builders/rajyash.webp",
  "adani realty": "/builders/adani.svg",
  "addor group": "/builders/addor.png",
  "aaryan group": "/builders/aaryan.png",
  "reneev developers": "/builders/reneev.png",
  "swagat group": "/builders/swagat.svg",
  "kaavyaratna group": "/builders/kavyaratna.png",
  "nakshatra group": "/builders/nakshatra.svg",
  "bakeri group": "/builders/bakeri.png",
  "godrej properties": "/builders/godrej-properties.svg",
  "saamarth group": "/builders/saamarth.png",
  "goyal & co.": "/builders/goyal-co.png",
  "goyal & co": "/builders/goyal-co.png",
};

function localForName(name?: string | null): string | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  if (LOCAL_BY_NAME[key]) return LOCAL_BY_NAME[key];
  for (const [k, path] of Object.entries(LOCAL_BY_NAME)) {
    if (key.includes(k) || k.includes(key)) return path;
  }
  return null;
}

export function resolveBuilderLogo(
  name?: string | null,
  logoUrl?: string | null,
): string | null {
  // Local contrast-fixed brand marks win over stale remote uploads
  const local = localForName(name);
  if (local) return local;

  if (logoUrl) {
    if (logoUrl.includes("res.cloudinary.com")) return logoUrl;

    if (
      logoUrl.includes("logo.clearbit.com") ||
      logoUrl.includes("google.com/s2/favicons")
    ) {
      return null;
    }

    if (logoUrl.startsWith("/builders/")) return logoUrl;

    if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) {
      return logoUrl;
    }
  }

  return null;
}
