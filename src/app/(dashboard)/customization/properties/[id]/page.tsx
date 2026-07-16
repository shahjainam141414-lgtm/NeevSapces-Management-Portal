"use client";

import { use } from "react";
import { PropertyEditPageContent } from "@/components/properties/property-edit-page-content";

export default function CustomizationPropertyEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <PropertyEditPageContent propertyId={id} />;
}
