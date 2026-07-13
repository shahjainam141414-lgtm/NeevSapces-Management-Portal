export type AdminProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  role: "Super Admin";
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
};
