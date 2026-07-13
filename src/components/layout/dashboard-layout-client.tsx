"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { AdminProfile } from "@/lib/admin-profiles";

export function DashboardLayoutClient({
  children,
  user,
}: {
  children: React.ReactNode;
  user: AdminProfile | null;
}) {
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
