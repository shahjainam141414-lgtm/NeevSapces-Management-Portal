import { redirect } from "next/navigation";

/** Projects master-list removed — use Properties instead */
export default function ProjectsRedirectPage() {
  redirect("/customization/properties");
}
