export type BannerSlot = "main";

export type SiteBanner = {
  id: string;
  slot: BannerSlot;
  image_url: string;
  cloudinary_public_id: string | null;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
};
