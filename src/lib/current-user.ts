/**
 * @deprecated Use getCurrentAdminProfile() from @/app/actions/auth
 * Kept only for any remaining static references during migration.
 */
export const currentUser = {
  name: "Admin",
  role: "Super Admin" as const,
  email: "",
  phone: "",
  joiningDate: "—",
};
