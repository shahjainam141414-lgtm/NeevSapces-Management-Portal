"use client";

import { MapPin, Star } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeaturedHomepagePanel } from "@/components/customization/featured-homepage-panel";
import { FeaturedByAreaPanel } from "@/components/customization/featured-by-area-panel";

export function FeaturedPropertiesPageContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Homepage & areas"
        title="Featured Properties"
      />

      <Tabs defaultValue="homepage" className="w-full">
        <TabsList className="flex h-auto w-full flex-col gap-1 rounded-2xl p-1.5 sm:h-11 sm:w-auto sm:flex-row sm:rounded-xl sm:p-1">
          <TabsTrigger
            value="homepage"
            className="w-full justify-center gap-2 px-3 py-2.5 sm:w-auto sm:px-4 sm:py-2"
          >
            <Star className="size-3.5 shrink-0" />
            <span className="truncate">Featured Properties</span>
          </TabsTrigger>
          <TabsTrigger
            value="by-area"
            className="w-full justify-center gap-2 px-3 py-2.5 sm:w-auto sm:px-4 sm:py-2"
          >
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">Featured Properties By Areas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="homepage" className="mt-4 sm:mt-6">
          <FeaturedHomepagePanel />
        </TabsContent>

        <TabsContent value="by-area" className="mt-4 sm:mt-6">
          <FeaturedByAreaPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
