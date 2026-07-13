export type AmenityStatus = "active" | "inactive";

export type Amenity = {
  id: string;
  title: string;
  icon_url: string | null;
  cloudinary_public_id: string | null;
  icon_key: string | null;
  status: AmenityStatus;
  is_default: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};
