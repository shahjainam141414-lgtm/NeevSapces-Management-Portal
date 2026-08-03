import { PropertyEditPageContent } from "@/components/properties/property-edit-page-content";

export default async function CustomizationPropertyEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PropertyEditPageContent propertyId={id} />;
}
