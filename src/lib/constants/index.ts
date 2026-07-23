export const COLORS = {
  mist: "#EEF1F6",
  porcelain: "#F7F8FB",
  ink: "#142033",
  slate: "#5B6B7C",
  horizon: "#2F6FED",
  horizonSoft: "#D9E6FF",
  hairline: "#D5DCE6",
} as const;

export const PROPERTY_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type PropertyStatusValue =
  (typeof PROPERTY_STATUS)[keyof typeof PROPERTY_STATUS];

export const ADMIN_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  EDITOR: "editor",
} as const;
