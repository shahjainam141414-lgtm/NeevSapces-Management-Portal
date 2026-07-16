"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { listAmenities } from "@/lib/amenities-api";
import { listBuilders } from "@/lib/builders-api";
import { listStaticOptions } from "@/lib/static-options-api";
import type { Amenity } from "@/lib/amenities";
import type { Builder } from "@/lib/builders";
import type { EntityItem } from "@/lib/static-options";
import {
  AVAILABILITY_OPTIONS,
  CONSTRUCTION_STATUS_OPTIONS,
  PARKING_OPTIONS,
  buildPropertySlug,
  type PropertyDetail,
  type PropertyFloorPlan,
  type PropertyStatus,
} from "@/lib/properties";
import {
  addPropertyMedia,
  deleteFloorPlan,
  deletePropertyMedia,
  getPropertyDetail,
  replaceFaqs,
  replaceHighlights,
  replaceSpecs,
  setPropertyAmenities,
  updateProperty,
  upsertFloorPlan,
} from "@/lib/properties-api";

const ACCEPT_IMG = "image/jpeg,image/png,image/webp,image/jpg";

function parseLines(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function parseFaqs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length < 2) return null;
      return { question: lines[0], answer: lines.slice(1).join(" ") };
    })
    .filter((x): x is { question: string; answer: string } => Boolean(x));
}

function faqsToText(
  faqs: { question: string; answer: string }[],
) {
  return faqs.map((f) => `${f.question}\n${f.answer}`).join("\n\n");
}

type EditableFloorPlan = {
  id?: string;
  name: string;
  bhk_label: string;
  rooms: string;
  balcony: string;
  bathroom: string;
  servant_room: string;
  area_sqft: string;
  area_sqyd: string;
  area_sqmt: string;
  price_label: string;
  image_url: string | null;
  cloudinary_public_id: string | null;
};

function planToEditable(p: PropertyFloorPlan): EditableFloorPlan {
  return {
    id: p.id,
    name: p.name,
    bhk_label: p.bhk_label ?? "",
    rooms: p.rooms != null ? String(p.rooms) : "",
    balcony: p.balcony != null ? String(p.balcony) : "",
    bathroom: p.bathroom != null ? String(p.bathroom) : "",
    servant_room: p.servant_room != null ? String(p.servant_room) : "",
    area_sqft: p.area_sqft != null ? String(p.area_sqft) : "",
    area_sqyd: p.area_sqyd != null ? String(p.area_sqyd) : "",
    area_sqmt: p.area_sqmt != null ? String(p.area_sqmt) : "",
    price_label: p.price_label ?? "",
    image_url: p.image_url,
    cloudinary_public_id: p.cloudinary_public_id,
  };
}

function emptyPlan(): EditableFloorPlan {
  return {
    name: "",
    bhk_label: "3 BHK",
    rooms: "3",
    balcony: "1",
    bathroom: "3",
    servant_room: "",
    area_sqft: "",
    area_sqyd: "",
    area_sqmt: "",
    price_label: "",
    image_url: null,
    cloudinary_public_id: null,
  };
}

function toNum(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

type Props = { propertyId: string };

export function PropertyEditPageContent({ propertyId }: Props) {
  const [detail, setDetail] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [areas, setAreas] = useState<EntityItem[]>([]);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [categories, setCategories] = useState<EntityItem[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<EntityItem[]>([]);

  // Core fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<PropertyStatus>("draft");
  const [isFeatured, setIsFeatured] = useState(false);
  const [listingBadge, setListingBadge] = useState("For Sale");
  const [areaId, setAreaId] = useState("");
  const [areaName, setAreaName] = useState("");
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("Gandhinagar");
  const [pincode, setPincode] = useState("");
  const [fullAddress, setFullAddress] = useState("");

  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverPublicId, setCoverPublicId] = useState<string | null>(null);
  const [brochureUrl, setBrochureUrl] = useState("");

  const [packagePrice, setPackagePrice] = useState("");
  const [priceNotes, setPriceNotes] = useState("");
  const [pricePerSqft, setPricePerSqft] = useState("");

  const [availability, setAvailability] = useState<string[]>([]);
  const [possessionBy, setPossessionBy] = useState("");
  const [propertyTypeLabel, setPropertyTypeLabel] = useState("");
  const [towerCount, setTowerCount] = useState("");
  const [unitCount, setUnitCount] = useState("");
  const [reraNo, setReraNo] = useState("");
  const [reraUrl, setReraUrl] = useState("");

  const [builderId, setBuilderId] = useState("");
  const [developerName, setDeveloperName] = useState("");
  const [categoryLabel, setCategoryLabel] = useState("");
  const [constructionStatus, setConstructionStatus] = useState("");

  const [projectSizeLabel, setProjectSizeLabel] = useState("");
  const [floorCount, setFloorCount] = useState("");
  const [totalPlotArea, setTotalPlotArea] = useState("");
  const [openAreaPercent, setOpenAreaPercent] = useState("");
  const [parkingTypes, setParkingTypes] = useState<string[]>([]);
  const [facing, setFacing] = useState("");
  const [projectPosition, setProjectPosition] = useState("");
  const [roadConnectivity, setRoadConnectivity] = useState("");
  const [currentStatus, setCurrentStatus] = useState("Available");
  const [about, setAbout] = useState("");

  const [highlightsText, setHighlightsText] = useState("");
  const [specsText, setSpecsText] = useState("");
  const [faqsText, setFaqsText] = useState("");
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);
  const [floorPlans, setFloorPlans] = useState<EditableFloorPlan[]>([]);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prop, areaRows, builderRows, amenityRows, catRows, typeRows] =
        await Promise.all([
          getPropertyDetail(propertyId),
          listStaticOptions("area"),
          listBuilders(),
          listAmenities(),
          listStaticOptions("category"),
          listStaticOptions("property_type"),
        ]);

      setDetail(prop);
      setAreas(areaRows.filter((a) => a.status === "active"));
      setBuilders(builderRows);
      setAmenities(amenityRows.filter((a) => a.status === "active"));
      setCategories(catRows.filter((c) => c.status === "active"));
      setPropertyTypes(typeRows.filter((t) => t.status === "active"));

      setTitle(prop.title);
      setSlug(prop.slug);
      setStatus(prop.status);
      setIsFeatured(prop.is_featured);
      setListingBadge(prop.listing_badge || "For Sale");
      setAreaId(prop.area_id ?? "");
      setAreaName(prop.area_name ?? "");
      setLocality(prop.locality ?? "");
      setCity(prop.city || "Gandhinagar");
      setPincode(prop.pincode ?? "");
      setFullAddress(prop.full_address ?? "");
      setCoverUrl(prop.cover_image_url);
      setCoverPublicId(prop.cover_cloudinary_public_id);
      setBrochureUrl(prop.brochure_url ?? "");
      setPackagePrice(prop.package_price_label ?? "");
      setPriceNotes(prop.package_price_notes ?? "");
      setPricePerSqft(prop.price_per_sqft_label ?? "");
      setAvailability(prop.availability ?? []);
      setPossessionBy(prop.possession_by ?? "");
      setPropertyTypeLabel(prop.property_type_label ?? "");
      setTowerCount(prop.tower_count != null ? String(prop.tower_count) : "");
      setUnitCount(prop.unit_count != null ? String(prop.unit_count) : "");
      setReraNo(prop.rera_no ?? "");
      setReraUrl(prop.rera_url ?? "");
      setBuilderId(prop.builder_id ?? "");
      setDeveloperName(prop.developer_name ?? "");
      setCategoryLabel(prop.category_label ?? "");
      setConstructionStatus(prop.construction_status ?? "");
      setProjectSizeLabel(prop.project_size_label ?? "");
      setFloorCount(prop.floor_count != null ? String(prop.floor_count) : "");
      setTotalPlotArea(prop.total_plot_area ?? "");
      setOpenAreaPercent(
        prop.open_area_percent != null ? String(prop.open_area_percent) : "",
      );
      setParkingTypes(prop.parking_types ?? []);
      setFacing(prop.facing ?? "");
      setProjectPosition(prop.project_position ?? "");
      setRoadConnectivity(prop.road_connectivity ?? "");
      setCurrentStatus(prop.current_status ?? "Available");
      setAbout(prop.about ?? "");
      setHighlightsText(prop.highlights.map((h) => h.content).join("\n"));
      setSpecsText(prop.specs.map((s) => s.content).join("\n"));
      setFaqsText(faqsToText(prop.faqs));
      setSelectedAmenityIds(prop.amenity_ids);
      setFloorPlans(prop.floor_plans.map(planToEditable));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load property");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleMulti = (
    list: string[],
    value: string,
    setter: (next: string[]) => void,
  ) => {
    setter(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
  };

  const onAreaChange = (id: string) => {
    setAreaId(id);
    const area = areas.find((a) => a.id === id);
    if (area) {
      setAreaName(area.name);
      if (!locality) setLocality(area.name);
    }
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    setError(null);
    try {
      const uploaded = await uploadToCloudinary(file, "neev/properties");
      setCoverUrl(uploaded.secure_url);
      setCoverPublicId(uploaded.public_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cover upload failed");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadingGallery(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const uploaded = await uploadToCloudinary(file, "neev/properties/gallery");
        const media = await addPropertyMedia({
          property_id: propertyId,
          image_url: uploaded.secure_url,
          cloudinary_public_id: uploaded.public_id,
        });
        setDetail((prev) =>
          prev ? { ...prev, media: [...prev.media, media] } : prev,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gallery upload failed");
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const nextSlug =
        slug.trim() || buildPropertySlug(title, areaName || null);

      const updated = await updateProperty({
        id: propertyId,
        title: title.trim(),
        slug: nextSlug,
        status,
        is_featured: isFeatured,
        listing_badge: listingBadge.trim() || "For Sale",
        area_id: areaId || null,
        area_name: areaName || null,
        locality: locality.trim() || null,
        city: city.trim() || "Gandhinagar",
        pincode: pincode.trim() || null,
        full_address: fullAddress.trim() || null,
        cover_image_url: coverUrl,
        cover_cloudinary_public_id: coverPublicId,
        brochure_url: brochureUrl.trim() || null,
        package_price_label: packagePrice.trim() || null,
        package_price_notes: priceNotes.trim() || null,
        price_per_sqft_label: pricePerSqft.trim() || null,
        availability,
        possession_by: possessionBy.trim() || null,
        property_type_label: propertyTypeLabel.trim() || null,
        tower_count: toNum(towerCount),
        unit_count: toNum(unitCount),
        rera_no: reraNo.trim() || null,
        rera_url: reraUrl.trim() || null,
        builder_id: builderId || null,
        developer_name: developerName.trim() || null,
        category_label: categoryLabel.trim() || null,
        construction_status: constructionStatus.trim() || null,
        project_size_label: projectSizeLabel.trim() || null,
        floor_count: toNum(floorCount),
        total_plot_area: totalPlotArea.trim() || null,
        open_area_percent: toNum(openAreaPercent),
        parking_types: parkingTypes,
        facing: facing.trim() || null,
        project_position: projectPosition.trim() || null,
        road_connectivity: roadConnectivity.trim() || null,
        current_status: currentStatus.trim() || null,
        about: about.trim() || null,
      });

      await setPropertyAmenities(propertyId, selectedAmenityIds);
      const highlights = await replaceHighlights(
        propertyId,
        parseLines(highlightsText),
      );
      const specs = await replaceSpecs(propertyId, parseLines(specsText));
      const faqs = await replaceFaqs(propertyId, parseFaqs(faqsText));

      // Persist floor plans (create/update); delete removed ones
      const existingIds = new Set(
        (detail?.floor_plans ?? []).map((p) => p.id),
      );
      const keptIds = new Set<string>();
      const savedPlans: PropertyFloorPlan[] = [];

      for (let i = 0; i < floorPlans.length; i++) {
        const plan = floorPlans[i];
        if (!plan.name.trim()) continue;
        const saved = await upsertFloorPlan({
          id: plan.id,
          property_id: propertyId,
          name: plan.name,
          bhk_label: plan.bhk_label || null,
          rooms: toNum(plan.rooms),
          balcony: toNum(plan.balcony),
          bathroom: toNum(plan.bathroom),
          servant_room: toNum(plan.servant_room),
          area_sqft: toNum(plan.area_sqft),
          area_sqyd: toNum(plan.area_sqyd),
          area_sqmt: toNum(plan.area_sqmt),
          price_label: plan.price_label || null,
          image_url: plan.image_url,
          cloudinary_public_id: plan.cloudinary_public_id,
          sort_order: i + 1,
        });
        savedPlans.push(saved);
        if (saved.id) keptIds.add(saved.id);
      }

      for (const id of existingIds) {
        if (!keptIds.has(id)) await deleteFloorPlan(id);
      }

      setSlug(updated.slug);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              ...updated,
              highlights,
              specs,
              faqs,
              amenity_ids: selectedAmenityIds,
              floor_plans: savedPlans,
            }
          : prev,
      );
      setFloorPlans(savedPlans.map(planToEditable));
      setMessage("Property saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const addressPreview = useMemo(() => {
    const parts = [
      locality || areaName,
      areaName,
      city,
      pincode ? `(${pincode})` : null,
    ].filter(Boolean);
    return parts.join(", ");
  }, [locality, areaName, city, pincode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin" />
        Loading property…
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-red-600">{error ?? "Property not found"}</p>
        <Button asChild variant="outline">
          <Link href="/customization/properties">Back to list</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Button
            asChild
            variant="ghost"
            className="-ml-2 mb-2 gap-1.5 text-slate-500"
          >
            <Link href="/customization/properties">
              <ArrowLeft className="size-4" />
              All properties
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1a2744]">
            {title || "Untitled property"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {addressPreview || "Fill location details"} · /{slug || "…"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={
              status === "active"
                ? "success"
                : status === "draft"
                  ? "warning"
                  : "secondary"
            }
          >
            {status}
          </Badge>
          <Button
            className="gap-2"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {saving ? "Saving…" : "Save all"}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      <Tabs defaultValue="basics" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="details">Project details</TabsTrigger>
          <TabsTrigger value="pricing">Rate card</TabsTrigger>
          <TabsTrigger value="plans">Floor plans</TabsTrigger>
          <TabsTrigger value="media">Photos</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
          <TabsTrigger value="content">Why / Specs / FAQ</TabsTrigger>
        </TabsList>

        {/* BASICS */}
        <TabsContent value="basics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identity &amp; location</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Slug (URL)</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Area</Label>
                <Select value={areaId || undefined} onValueChange={onAreaChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Locality</Label>
                <Input
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="382421"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Full address</Label>
                <Input
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="Kudasan, Kudasan, Gandhinagar (382421)"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as PropertyStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Listing badge</Label>
                <Input
                  value={listingBadge}
                  onChange={(e) => setListingBadge(e.target.value)}
                  placeholder="For Sale"
                />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <input
                  id="featured"
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="size-4 rounded border-slate-300"
                />
                <Label htmlFor="featured" className="cursor-pointer font-normal">
                  Featured listing
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cover image &amp; brochure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-start gap-4">
                <div className="relative size-36 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-slate-400">
                      <ImagePlus className="size-6" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept={ACCEPT_IMG}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleCoverUpload(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingCover}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {uploadingCover ? "Uploading…" : "Upload cover"}
                  </Button>
                  {coverUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => {
                        setCoverUrl(null);
                        setCoverPublicId(null);
                      }}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Brochure URL</Label>
                <Input
                  value={brochureUrl}
                  onChange={(e) => setBrochureUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DETAILS */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick details strip</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Availability (BHK / configs)</Label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABILITY_OPTIONS.map((opt) => {
                    const on = availability.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          toggleMulti(availability, opt, setAvailability)
                        }
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          on
                            ? "border-[#1a2744] bg-[#1a2744] text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Possession by</Label>
                  <Input
                    value={possessionBy}
                    onChange={(e) => setPossessionBy(e.target.value)}
                    placeholder="Dec, 2027"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Input
                    value={propertyTypeLabel}
                    onChange={(e) => setPropertyTypeLabel(e.target.value)}
                    placeholder="Flats / Apartments"
                    list="property-type-suggestions"
                  />
                  <datalist id="property-type-suggestions">
                    {propertyTypes.map((t) => (
                      <option key={t.id} value={t.name} />
                    ))}
                    <option value="Flats / Apartments" />
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label>Towers</Label>
                  <Input
                    type="number"
                    value={towerCount}
                    onChange={(e) => setTowerCount(e.target.value)}
                    placeholder="2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Units</Label>
                  <Input
                    type="number"
                    value={unitCount}
                    onChange={(e) => setUnitCount(e.target.value)}
                    placeholder="144"
                  />
                </div>
                <div className="space-y-2">
                  <Label>RERA No</Label>
                  <Input
                    value={reraNo}
                    onChange={(e) => setReraNo(e.target.value)}
                    placeholder="RN137AA10037/270722"
                  />
                </div>
                <div className="space-y-2">
                  <Label>RERA URL</Label>
                  <Input
                    value={reraUrl}
                    onChange={(e) => setReraUrl(e.target.value)}
                    placeholder="https://gujrera.gujarat.gov.in"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Extended project details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Developer / Builder</Label>
                <Select
                  value={builderId || "__none__"}
                  onValueChange={(v) => {
                    const id = v === "__none__" ? "" : v;
                    setBuilderId(id);
                    const b = builders.find((x) => x.id === id);
                    if (b) setDeveloperName(b.name);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select builder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {builders
                      .filter((b) => b.status === "active" || b.id === builderId)
                      .map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                          {b.status !== "active" ? " (inactive)" : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Developer name (display)</Label>
                <Input
                  value={developerName}
                  onChange={(e) => setDeveloperName(e.target.value)}
                  placeholder="dev vinayak"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={categoryLabel}
                  onChange={(e) => setCategoryLabel(e.target.value)}
                  placeholder="Residential - Flats / Apartments"
                  list="category-suggestions"
                />
                <datalist id="category-suggestions">
                  {categories.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                  <option value="Residential - Flats / Apartments" />
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Construction status</Label>
                <Input
                  value={constructionStatus}
                  onChange={(e) => setConstructionStatus(e.target.value)}
                  placeholder="Under Construction"
                  list="construction-status-suggestions"
                />
                <datalist id="construction-status-suggestions">
                  {CONSTRUCTION_STATUS_OPTIONS.map((o) => (
                    <option key={o} value={o} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Project size label</Label>
                <Input
                  value={projectSizeLabel}
                  onChange={(e) => setProjectSizeLabel(e.target.value)}
                  placeholder="2 Tower - 144 Units"
                />
              </div>
              <div className="space-y-2">
                <Label>No. of floors</Label>
                <Input
                  type="number"
                  value={floorCount}
                  onChange={(e) => setFloorCount(e.target.value)}
                  placeholder="21"
                />
              </div>
              <div className="space-y-2">
                <Label>Total plot area</Label>
                <Input
                  value={totalPlotArea}
                  onChange={(e) => setTotalPlotArea(e.target.value)}
                  placeholder="5200 Sq Mt"
                />
              </div>
              <div className="space-y-2">
                <Label>Open area %</Label>
                <Input
                  type="number"
                  value={openAreaPercent}
                  onChange={(e) => setOpenAreaPercent(e.target.value)}
                  placeholder="65"
                />
              </div>
              <div className="space-y-2">
                <Label>Facing</Label>
                <Input
                  value={facing}
                  onChange={(e) => setFacing(e.target.value)}
                  placeholder="East"
                />
              </div>
              <div className="space-y-2">
                <Label>Project position</Label>
                <Input
                  value={projectPosition}
                  onChange={(e) => setProjectPosition(e.target.value)}
                  placeholder="2 Side Open"
                />
              </div>
              <div className="space-y-2">
                <Label>Road connectivity</Label>
                <Input
                  value={roadConnectivity}
                  onChange={(e) => setRoadConnectivity(e.target.value)}
                  placeholder="100 feet"
                />
              </div>
              <div className="space-y-2">
                <Label>Current status</Label>
                <Input
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  placeholder="Available"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Parking types</Label>
                <div className="flex flex-wrap gap-2">
                  {PARKING_OPTIONS.map((opt) => {
                    const on = parkingTypes.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          toggleMulti(parkingTypes, opt, setParkingTypes)
                        }
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          on
                            ? "border-[#1a2744] bg-[#1a2744] text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>About</Label>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#1a2744]/20"
                  placeholder="Project description shown on the detail page…"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRICING */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rate card</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Package price</Label>
                <Input
                  value={packagePrice}
                  onChange={(e) => setPackagePrice(e.target.value)}
                  placeholder="1.55 Cr.*"
                />
              </div>
              <div className="space-y-2">
                <Label>Price per sq.ft.</Label>
                <Input
                  value={pricePerSqft}
                  onChange={(e) => setPricePerSqft(e.target.value)}
                  placeholder="Price on Request/ Sq.Ft.*"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Package price notes</Label>
                <Input
                  value={priceNotes}
                  onChange={(e) => setPriceNotes(e.target.value)}
                  placeholder="Incl All Charges - Onwards*"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FLOOR PLANS */}
        <TabsContent value="plans" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Add configs like &ldquo;3 BHK Type 1&rdquo; with area and price.
            </p>
            <Button
              type="button"
              variant="outline"
              className="gap-1.5"
              onClick={() => setFloorPlans((prev) => [...prev, emptyPlan()])}
            >
              <Plus className="size-4" />
              Add floor plan
            </Button>
          </div>

          {floorPlans.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-slate-500">
                No floor plans yet.
              </CardContent>
            </Card>
          ) : (
            floorPlans.map((plan, index) => (
              <Card key={plan.id ?? `new-${index}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">
                    Floor plan {index + 1}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-600"
                    onClick={() =>
                      setFloorPlans((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Name</Label>
                    <Input
                      value={plan.name}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFloorPlans((prev) =>
                          prev.map((p, i) =>
                            i === index ? { ...p, name: v } : p,
                          ),
                        );
                      }}
                      placeholder="3 BHK Type 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>BHK label</Label>
                    <Input
                      value={plan.bhk_label}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFloorPlans((prev) =>
                          prev.map((p, i) =>
                            i === index ? { ...p, bhk_label: v } : p,
                          ),
                        );
                      }}
                      placeholder="3 BHK"
                    />
                  </div>
                  {(
                    [
                      ["rooms", "Rooms"],
                      ["balcony", "Balcony"],
                      ["bathroom", "Bathroom"],
                      ["servant_room", "Servant room"],
                      ["area_sqft", "Area sq.ft."],
                      ["area_sqyd", "Area sq.yd."],
                      ["area_sqmt", "Area sq.mt."],
                      ["price_label", "Price"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-2">
                      <Label>{label}</Label>
                      <Input
                        value={plan[key]}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFloorPlans((prev) =>
                            prev.map((p, i) =>
                              i === index ? { ...p, [key]: v } : p,
                            ),
                          );
                        }}
                        placeholder={key === "price_label" ? "1.45 Cr.*" : ""}
                      />
                    </div>
                  ))}
                  <div className="space-y-2 sm:col-span-3">
                    <Label>Floor plan image URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={plan.image_url ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFloorPlans((prev) =>
                            prev.map((p, i) =>
                              i === index
                                ? { ...p, image_url: v || null }
                                : p,
                            ),
                          );
                        }}
                        placeholder="Upload or paste URL"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = ACCEPT_IMG;
                          input.onchange = async () => {
                            const file = input.files?.[0];
                            if (!file) return;
                            try {
                              const uploaded = await uploadToCloudinary(
                                file,
                                "neev/properties/floor-plans",
                              );
                              setFloorPlans((prev) =>
                                prev.map((p, i) =>
                                  i === index
                                    ? {
                                        ...p,
                                        image_url: uploaded.secure_url,
                                        cloudinary_public_id: uploaded.public_id,
                                      }
                                    : p,
                                ),
                              );
                            } catch (err) {
                              setError(
                                err instanceof Error
                                  ? err.message
                                  : "Floor plan upload failed",
                              );
                            }
                          };
                          input.click();
                        }}
                      >
                        Upload
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* MEDIA */}
        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Gallery photos</CardTitle>
              <div>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept={ACCEPT_IMG}
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    void handleGalleryUpload(e.target.files);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadingGallery}
                  onClick={() => galleryInputRef.current?.click()}
                >
                  {uploadingGallery ? "Uploading…" : "Add photos"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {detail.media.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No gallery images yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {detail.media.map((m) => (
                    <div
                      key={m.id}
                      className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.image_url}
                        alt=""
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute top-2 right-2 rounded-full bg-white/90 p-1 text-red-600 opacity-0 shadow transition-opacity group-hover:opacity-100"
                        onClick={() => {
                          void deletePropertyMedia(m.id).then(() => {
                            setDetail((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    media: prev.media.filter((x) => x.id !== m.id),
                                  }
                                : prev,
                            );
                          });
                        }}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AMENITIES */}
        <TabsContent value="amenities">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select amenities</CardTitle>
            </CardHeader>
            <CardContent>
              {amenities.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No amenities in master list.{" "}
                  <Link
                    href="/customization/amenities"
                    className="underline underline-offset-2"
                  >
                    Add amenities
                  </Link>
                  .
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {amenities.map((a) => {
                    const on = selectedAmenityIds.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() =>
                          toggleMulti(
                            selectedAmenityIds,
                            a.id,
                            setSelectedAmenityIds,
                          )
                        }
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          on
                            ? "border-[#1a2744] bg-[#1a2744] text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {a.title}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTENT */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Why this project</CardTitle>
            </CardHeader>
            <CardContent>
              <Label className="mb-2 block text-slate-500">
                One highlight per line
              </Label>
              <textarea
                value={highlightsText}
                onChange={(e) => setHighlightsText(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#1a2744]/20"
                placeholder={
                  "Club-Class Amenities: …\nPrime Location with easy access to …\nLuxury Redefined: …"
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <Label className="mb-2 block text-slate-500">
                One specification per line
              </Label>
              <textarea
                value={specsText}
                onChange={(e) => setSpecsText(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#1a2744]/20"
                placeholder={
                  "Bedrooms: Wooden finish vitrified tiles\nDouble Height Balcony and Infinity Swimming Pool\n21 Storey"
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">FAQs</CardTitle>
            </CardHeader>
            <CardContent>
              <Label className="mb-2 block text-slate-500">
                Question on first line, answer on next line(s). Separate FAQs
                with a blank line.
              </Label>
              <textarea
                value={faqsText}
                onChange={(e) => setFaqsText(e.target.value)}
                rows={10}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#1a2744]/20"
                placeholder={
                  "What is The Privilon location?\nThe Privilon is located in Kudasan, Gandhinagar, Gujarat.\n\nWhat is the possession timeline?\nReady for possession by December 2027"
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button
          className="gap-2 shadow-lg"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {saving ? "Saving…" : "Save all changes"}
        </Button>
      </div>
    </div>
  );
}
