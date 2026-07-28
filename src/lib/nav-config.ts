import {
  LayoutDashboard,
  SlidersHorizontal,
  Users,
  Inbox,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const mainNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    title: "Customization",
    href: "/customization/areas",
    icon: SlidersHorizontal,
  },
  { title: "Lead inbox", href: "/leads", icon: Inbox },
  { title: "Users", href: "/users", icon: Users },
];

export const customizationTabs = [
  { id: "areas", label: "Areas", href: "/customization/areas" },
  {
    id: "properties",
    label: "Properties",
    href: "/customization/properties",
  },
  { id: "main-banner", label: "Main Banner", href: "/customization/main-banner" },
  { id: "builders", label: "Builders", href: "/customization/builders" },
  { id: "amenities", label: "Amenities", href: "/customization/amenities" },
  { id: "property-types", label: "Property Types", href: "/customization/property-types" },
  { id: "featured", label: "Featured Properties", href: "/customization/featured" },
] as const;

export type UserRole = "Super Admin" | "Manager";

export const userRoles: UserRole[] = ["Super Admin", "Manager"];
