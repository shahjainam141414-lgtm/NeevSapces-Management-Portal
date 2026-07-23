import type { UserRole } from "@/lib/nav-config";

export type AdminProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  role: UserRole;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
};
