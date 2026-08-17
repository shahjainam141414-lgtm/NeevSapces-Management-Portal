export type SiteDetails = {
  id: number;
  phone_display: string;
  phone_tel: string;
  email: string;
  address: string;
  updated_at?: string;
};

/** Keep in sync with website `SITE` in website/src/lib/constants */
export const DEFAULT_SITE_DETAILS: Omit<SiteDetails, "id" | "updated_at"> = {
  phone_display: "+91 76002 71405",
  phone_tel: "+917600271405",
  email: "info@neevspaces.com",
  address: "Gujarat, India",
};

export function toPhoneTel(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith("91") && digits.length >= 12) return `+${digits}`;
  if (digits.length > 0) return `+${digits}`;
  return "";
}
