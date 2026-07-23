import type { UserRole } from "@/lib/nav-config";

export const ROLE_RANK: Record<UserRole, number> = {
  "Super Admin": 100,
  Manager: 50,
};

export function isUserRole(value: string): value is UserRole {
  return value === "Super Admin" || value === "Manager";
}

export function roleRank(role: string) {
  return isUserRole(role) ? ROLE_RANK[role] : 0;
}

/**
 * Super Admin can delete anyone except self.
 * Manager cannot delete equal or higher roles (including Super Admin).
 */
export function canDeleteUser(
  actorRole: string,
  targetRole: string,
  isSelf: boolean,
) {
  if (isSelf) return false;
  if (actorRole === "Super Admin") return true;
  if (targetRole === "Super Admin") return false;
  return roleRank(actorRole) > roleRank(targetRole);
}

/**
 * Actor may only assign roles at or below their own rank.
 * Manager cannot assign Super Admin.
 */
export function canAssignRole(actorRole: string, roleToAssign: string) {
  if (!isUserRole(roleToAssign)) return false;
  if (actorRole !== "Super Admin" && roleToAssign === "Super Admin") {
    return false;
  }
  return roleRank(actorRole) >= roleRank(roleToAssign);
}

/**
 * Self can always edit own profile (role stays locked in the form/server).
 * Manager can edit other Managers, but never Super Admins.
 */
export function canEditUser(
  actorRole: string,
  targetRole: string,
  isSelf: boolean,
) {
  if (isSelf) return true;
  if (actorRole === "Super Admin") return true;
  if (targetRole === "Super Admin") return false;
  return roleRank(actorRole) >= roleRank(targetRole);
}

export function assignableRoles(actorRole: string): UserRole[] {
  const roles: UserRole[] = ["Super Admin", "Manager"];
  return roles.filter((r) => canAssignRole(actorRole, r));
}
