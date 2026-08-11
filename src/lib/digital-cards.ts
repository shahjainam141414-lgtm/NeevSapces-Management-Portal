export type DigitalCardAccent = "steel" | "bronze";
export type DigitalCardStatus = "active" | "inactive";

export type DigitalCard = {
  id: string;
  admin_profile_id: string;
  slug: string;
  display_name: string;
  first_name: string;
  last_name: string;
  role_title: string;
  tagline: string;
  phone_display: string;
  phone_tel: string;
  whatsapp: string;
  email: string;
  photo_url: string | null;
  accent: DigitalCardAccent;
  cover_url: string;
  office_address: string;
  maps_query: string;
  rera: string;
  status: DigitalCardStatus;
  created_at?: string;
  updated_at?: string;
};

/** Shared company + office details — same on every card */
export const CARD_COMPANY = {
  name: "Neev Spaces",
  tagline: "Create Your Legacy With Strong Neev",
  website: "https://neevspaces.net",
  instagram: "https://www.instagram.com/neevspaces/",
  phoneDisplay: "+91 76002 71405",
  phoneTel: "+917600271405",
  address: "A 707, Ganesh Glory 11, Jagatpura Road, Gota, Ahmedabad 382470",
  mapsQuery: "A 707 Ganesh Glory 11 Jagatpura Road Gota Ahmedabad 382470",
  rera: "AG/GJ/AHMEDABAD/AHMEDABAD CITY/AA06547/180631R1",
} as const;

export const DEFAULT_CARD_COVER =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80";

export const DEFAULT_CARD_TAGLINE = "Create Your Legacy With Strong Neev";

export const DEFAULT_CARD_ROLE = "Property Advisor";

export function getCardPublicBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_CARD_BASE_URL?.replace(/\/$/, "") ||
    "https://neevspaces.net"
  );
}

export function getCardPublicUrl(slug: string) {
  return `${getCardPublicBaseUrl()}/card/${slug}`;
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function slugifyName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function splitDisplayName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "Advisor";
  const lastName = parts.slice(1).join(" ") || "Team";
  return { firstName, lastName };
}

export function formatPhoneFields(phone: string | null | undefined) {
  const raw = digitsOnly(phone ?? "");
  if (!raw) {
    return {
      phoneDisplay: CARD_COMPANY.phoneDisplay,
      phoneTel: CARD_COMPANY.phoneTel,
      whatsapp: digitsOnly(CARD_COMPANY.phoneTel),
    };
  }

  const whatsapp =
    raw.length === 10 ? `91${raw}` : raw.startsWith("91") ? raw : raw;
  const national =
    whatsapp.startsWith("91") && whatsapp.length >= 12
      ? whatsapp.slice(2)
      : raw.length === 10
        ? raw
        : raw;
  const phoneTel = whatsapp.startsWith("91")
    ? `+${whatsapp}`
    : `+${whatsapp}`;
  const phoneDisplay =
    national.length === 10
      ? `+91 ${national.slice(0, 5)} ${national.slice(5)}`
      : phoneTel;

  return { phoneDisplay, phoneTel, whatsapp };
}

export function mapsQueryFromAddress(address: string) {
  return address.replace(/,/g, " ").replace(/\s+/g, " ").trim();
}

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "NS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}
