import { DashboardLayoutClient } from "@/components/layout/dashboard-layout-client";
import { getCurrentAdminProfile } from "@/app/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentAdminProfile();

  return (
    <DashboardLayoutClient user={user}>{children}</DashboardLayoutClient>
  );
}
