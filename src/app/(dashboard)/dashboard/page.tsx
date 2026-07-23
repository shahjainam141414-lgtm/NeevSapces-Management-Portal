import { getCurrentAdminProfile } from "@/app/actions/auth";
import { DashboardPageContent } from "@/components/dashboard/dashboard-page-content";

export default async function DashboardPage() {
  const user = await getCurrentAdminProfile();
  return <DashboardPageContent user={user} />;
}
