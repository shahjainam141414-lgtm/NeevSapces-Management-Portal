import { CustomizationShell } from "@/components/customization/customization-shell";

export default function CustomizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CustomizationShell>{children}</CustomizationShell>;
}
