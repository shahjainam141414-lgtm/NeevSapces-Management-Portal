import { redirect } from "next/navigation";
import { getCurrentAdminProfile } from "@/app/actions/auth";

export default async function HomePage() {
  const user = await getCurrentAdminProfile();
  redirect(user ? "/dashboard" : "/login");
}
