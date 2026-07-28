"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  FileText,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChipGroup, ChipToggle } from "@/components/ui/chip-toggle";
import {
  ImageUploadField,
  ImagePreviewOverlay,
} from "@/components/ui/image-upload-field";
import { AlertBanner } from "@/components/ui/alert-banner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
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
  CURRENT_STATUS_OPTIONS,
  LISTING_BADGE_OPTIONS,
  PARKING_OPTIONS,
  buildPropertySlug,
  autoPriceRangeFromCards,
  seedRateCardsFromLegacy,
  type PropertyDetail,
  type PropertyFloorPlan,
  type PropertyRateCard,
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
import { RateCardsEditor } from "@/components/properties/rate-cards-editor";
import { InlineTextRows, type TextRow } from "@/components/properties/inline-text-rows";
import {
  LabelValueRows,
  type LabelValueRow,
} from "@/components/properties/label-value-rows";
import {
  FaqAccordionEditor,
  type FaqRow,
} from "@/components/properties/faq-accordion-editor";
import { AmenityPicker } from "@/components/properties/amenity-picker";

const ACCEPT_IMG = "image/jpeg,image/png,image/webp,image/jpg";

const EDIT_TABS = [
  { value: "basics", label: "Basics" },
  { value: "details", label: "Project details" },
  { value: "pricing", label: "Rate card" },
  { value: "plans", label: "Floor plans" },
  { value: "media", label: "Photos" },
  { value: "amenities", label: "Amenities" },
  { value: "content", label: "Why / Specs / FAQ" },
] as const;

const cardMotion = (index: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: {
    delay: index * 0.06,
    duration: 0.4,
    ease: [0.22, 1, 0.36, 1] as const,
  },
});

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
    rooms: "",
    balcony: "",
    bathroom: "",
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
  const router = useRouter();
  const [detail, setDetail] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [areas, setAreas] = useState<EntityItem[]>([]);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);

  const [activeTab, setActiveTab] = useState<string>("basics");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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

  const [rateCards, setRateCards] = useState<PropertyRateCard[]>([]);
  const [priceRangeLabel, setPriceRangeLabel] = useState("");
  const [lockPriceRange, setLockPriceRange] = useState(false);

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

  const [highlightRows, setHighlightRows] = useState<TextRow[]>([]);
  const [specRows, setSpecRows] = useState<LabelValueRow[]>([]);
  const [faqRows, setFaqRows] = useState<FaqRow[]>([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);
  const [floorPlans, setFloorPlans] = useState<EditableFloorPlan[]>([]);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingBrochure, setUploadingBrochure] = useState(false);
  const [uploadingPlans, setUploadingPlans] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const brochureInputRef = useRef<HTMLInputElement>(null);
  const plansInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prop, areaRows, builderRows, amenityRows] = await Promise.all([
        getPropertyDetail(propertyId),
        listStaticOptions("area"),
        listBuilders(),
        listAmenities(),
      ]);

      setDetail(prop);
      setAreas(areaRows.filter((a) => a.status === "active"));
      setBuilders(builderRows);
      setAmenities(amenityRows.filter((a) => a.status === "active"));

      const activeAmenities = amenityRows.filter((a) => a.status === "active");
      const defaultAmenityIds = activeAmenities
        .filter((a) => a.is_default)
        .map((a) => a.id);
      // New drafts (or properties with no amenities yet) start with defaults selected
      setSelectedAmenityIds(
        prop.amenity_ids.length > 0 ? prop.amenity_ids : defaultAmenityIds,
      );

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
      {
        const cards = seedRateCardsFromLegacy(prop);
        const auto = autoPriceRangeFromCards(cards);
        const stored = (prop.package_price_label ?? "").trim();
        setRateCards(cards);
        setPriceRangeLabel(stored || auto);
        setLockPriceRange(Boolean(stored && auto && stored !== auto));
      }
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
      setHighlightRows(
        prop.highlights.map((h) => ({
          id: h.id,
          content: h.content,
        })),
      );
      setSpecRows(
        prop.specs.map((s) => ({
          id: s.id,
          label: s.label ?? "",
          value: s.content,
        })),
      );
      setFaqRows(
        prop.faqs.map((f) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
        })),
      );
      setFloorPlans(prop.floor_plans.map(planToEditable));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load property");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    // Standard fetch-on-mount effect; load()'s internal setLoading(true)
    // is what the rule flags, but this is the intentional initial load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Cover accepts multiple: first file becomes the cover, the rest are pushed
  // straight into the gallery so the admin can drop everything in one go.
  const handleCoverMultiUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);
    setUploadingCover(true);
    setError(null);
    try {
      const [first, ...rest] = list;
      const uploaded = await uploadToCloudinary(first, "neev/properties");
      setCoverUrl(uploaded.secure_url);
      setCoverPublicId(uploaded.public_id);
      for (const file of rest) {
        const up = await uploadToCloudinary(file, "neev/properties/gallery");
        const media = await addPropertyMedia({
          property_id: propertyId,
          image_url: up.secure_url,
          cloudinary_public_id: up.public_id,
        });
        setDetail((prev) =>
          prev ? { ...prev, media: [...prev.media, media] } : prev,
        );
      }
      if (rest.length > 0) {
        setMessage(
          `Cover set · ${rest.length} more photo${rest.length === 1 ? "" : "s"} added to the gallery.`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleBrochureUpload = async (file: File) => {
    setUploadingBrochure(true);
    setError(null);
    try {
      const uploaded = await uploadToCloudinary(
        file,
        "neev/properties/brochures",
        "auto",
      );
      setBrochureUrl(uploaded.secure_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Brochure upload failed");
    } finally {
      setUploadingBrochure(false);
    }
  };

  // Bulk floor-plan images: each selected image spins up its own plan row.
  const handleFloorPlansBulkUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadingPlans(true);
    setError(null);
    try {
      const startIndex = floorPlans.length;
      const newPlans: EditableFloorPlan[] = [];
      let i = 0;
      for (const file of Array.from(files)) {
        const uploaded = await uploadToCloudinary(
          file,
          "neev/properties/floor-plans",
        );
        newPlans.push({
          ...emptyPlan(),
          name: `Floor plan ${startIndex + i + 1}`,
          image_url: uploaded.secure_url,
          cloudinary_public_id: uploaded.public_id,
        });
        i += 1;
      }
      setFloorPlans((prev) => [...prev, ...newPlans]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Floor plan upload failed");
    } finally {
      setUploadingPlans(false);
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

  const handleFloorPlanUpload = async (index: number, file: File) => {
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
        err instanceof Error ? err.message : "Floor plan upload failed",
      );
    }
  };

  const handleSave = async (): Promise<boolean> => {
    if (!title.trim()) {
      setError("Title is required");
      setActiveTab("basics");
      return false;
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
        rate_cards: rateCards,
        package_price_label: priceRangeLabel.trim() || null,
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
        highlightRows.map((r) => r.content),
      );
      const specs = await replaceSpecs(
        propertyId,
        specRows.map((r) => ({
          label: r.label,
          content: r.value,
        })),
      );
      const faqs = await replaceFaqs(
        propertyId,
        faqRows.map((r) => ({
          question: r.question,
          answer: r.answer,
        })),
      );

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
      setHighlightRows(
        highlights.map((h) => ({ id: h.id, content: h.content })),
      );
      setSpecRows(
        specs.map((s) => ({
          id: s.id,
          label: s.label ?? "",
          value: s.content,
        })),
      );
      setFaqRows(
        faqs.map((f) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
        })),
      );
      {
        const cards = updated.rate_cards ?? rateCards;
        const auto = autoPriceRangeFromCards(cards);
        const stored = (updated.package_price_label ?? "").trim();
        setRateCards(cards);
        setPriceRangeLabel(stored || auto);
        setLockPriceRange(Boolean(stored && auto && stored !== auto));
      }
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
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const isLastTab = activeTab === EDIT_TABS[EDIT_TABS.length - 1].value;

  const handleSaveAndNext = async () => {
    const ok = await handleSave();
    if (!ok) return;
    const idx = EDIT_TABS.findIndex((t) => t.value === activeTab);
    if (idx < EDIT_TABS.length - 1) {
      setActiveTab(EDIT_TABS[idx + 1].value);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleSaveAndFinish = async () => {
    const ok = await handleSave();
    if (ok) router.push("/customization/properties");
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

  const activeTabIndex = EDIT_TABS.findIndex((t) => t.value === activeTab);

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
      <div className="mx-auto max-w-md space-y-4 py-12 text-center">
        <AlertBanner variant="error" className="text-left">
          {error ?? "Property not found"}
        </AlertBanner>
        <Button asChild variant="outline">
          <Link href="/customization/properties">Back to list</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)]"
      >
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-br from-[#eef1f6]/90 via-white to-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
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
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-[#16233f]">
                {title || "Untitled property"}
              </h1>
              <StatusBadge status={status} />
              {isFeatured ? (
                <span className="rounded-full bg-[#16233f]/8 px-2.5 py-0.5 text-[11px] font-semibold text-[#16233f]">
                  Featured
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 truncate text-sm text-slate-500">
              {addressPreview || "Fill location details"} · /{slug || "…"}
            </p>
          </div>
        </div>

        <div className="px-3 py-3 sm:px-5 sm:py-4">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Step {activeTabIndex + 1} of {EDIT_TABS.length}
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {EDIT_TABS.map((tab, i) => {
              const active = tab.value === activeTab;
              const done = i < activeTabIndex;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all duration-200",
                    active
                      ? "bg-[#16233f] text-white shadow-[0_6px_18px_rgba(22,35,63,0.28)]"
                      : done
                        ? "bg-[#eef1f6] text-[#16233f] hover:bg-[#e4e9f2]"
                        : "bg-slate-50 text-slate-500 ring-1 ring-slate-200/80 hover:bg-white hover:text-slate-800",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                      active
                        ? "bg-white/20 text-white"
                        : done
                          ? "bg-[#16233f]/12 text-[#16233f]"
                          : "bg-slate-200/80 text-slate-500",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {error ? <AlertBanner variant="error">{error}</AlertBanner> : null}
      {message ? <AlertBanner variant="success">{message}</AlertBanner> : null}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="sr-only">
          {EDIT_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* BASICS */}
        <TabsContent value="basics" className="space-y-4">
          <motion.div {...cardMotion(0)}>
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
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="pt-0.5">
                    <StatusBadge status={status} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Listing badge</Label>
                  <Select
                    value={listingBadge || undefined}
                    onValueChange={setListingBadge}
                  >
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue placeholder="Select badge" />
                    </SelectTrigger>
                    <SelectContent>
                      {LISTING_BADGE_OPTIONS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2.5 sm:col-span-2">
                  <Checkbox
                    id="featured"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                  />
                  <Label htmlFor="featured" className="cursor-pointer font-normal">
                    Featured listing
                  </Label>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div {...cardMotion(1)}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cover image &amp; brochure</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 lg:grid-cols-2">
                {/* Cover image (supports selecting many at once) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label>Cover image</Label>
                    <span className="text-[11px] text-slate-400">
                      Shown as the listing hero
                    </span>
                  </div>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept={ACCEPT_IMG}
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      void handleCoverMultiUpload(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  {coverUrl ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,25,46,0.03)]">
                      <div className="relative aspect-video w-full bg-slate-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={coverUrl}
                          alt="Cover"
                          className="size-full object-cover"
                        />
                        {uploadingCover && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                            <Loader2 className="size-5 animate-spin text-[#16233f]" />
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 p-2.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewImage(coverUrl)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Preview
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={uploadingCover}
                          onClick={() => coverInputRef.current?.click()}
                        >
                          <ImagePlus className="h-3.5 w-3.5" />
                          Change
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                          onClick={() => {
                            setCoverUrl(null);
                            setCoverPublicId(null);
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={uploadingCover}
                      onClick={() => coverInputRef.current?.click()}
                      className="group flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 text-center transition-all duration-200 hover:border-[#16233f]/35 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {uploadingCover ? (
                        <Loader2 className="size-6 animate-spin text-slate-400" />
                      ) : (
                        <ImagePlus className="size-6 text-slate-400 transition group-hover:text-[#16233f]" />
                      )}
                      <span className="text-sm font-medium text-slate-800">
                        {uploadingCover ? "Uploading…" : "Upload cover image"}
                      </span>
                      <span className="text-xs text-slate-500">
                        JPG, PNG or WebP · select several — first is the cover,
                        rest go to gallery
                      </span>
                    </button>
                  )}
                </div>

                {/* Brochure (file, not URL) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label>Brochure</Label>
                    <span className="text-[11px] text-slate-400">
                      PDF or image
                    </span>
                  </div>
                  <input
                    ref={brochureInputRef}
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleBrochureUpload(file);
                      e.target.value = "";
                    }}
                  />
                  {brochureUrl ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(16,25,46,0.03)]">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#16233f]/8 text-[#16233f]">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          Brochure attached
                        </p>
                        <a
                          href={brochureUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-[#16233f] underline underline-offset-2"
                        >
                          Open file
                        </a>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={uploadingBrochure}
                          onClick={() => brochureInputRef.current?.click()}
                        >
                          Change
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => setBrochureUrl("")}
                          aria-label="Remove brochure"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={uploadingBrochure}
                      onClick={() => brochureInputRef.current?.click()}
                      className="group flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 text-center transition-all duration-200 hover:border-[#16233f]/35 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {uploadingBrochure ? (
                        <Loader2 className="size-6 animate-spin text-slate-400" />
                      ) : (
                        <Upload className="size-6 text-slate-400 transition group-hover:text-[#16233f]" />
                      )}
                      <span className="text-sm font-medium text-slate-800">
                        {uploadingBrochure ? "Uploading…" : "Upload brochure"}
                      </span>
                      <span className="text-xs text-slate-500">
                        Choose a PDF or image file
                      </span>
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* DETAILS */}
        <TabsContent value="details" className="space-y-4">
          <motion.div {...cardMotion(0)}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Availability (BHK / configs)</Label>
                  <ChipGroup>
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <ChipToggle
                        key={opt}
                        selected={availability.includes(opt)}
                        onClick={() =>
                          toggleMulti(availability, opt, setAvailability)
                        }
                      >
                        {opt}
                      </ChipToggle>
                    ))}
                  </ChipGroup>
                </div>

                <div className="h-px bg-slate-100" />

                <div className="grid gap-4 sm:grid-cols-2">
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
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder="Select builder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {builders
                          .filter(
                            (b) => b.status === "active" || b.id === builderId,
                          )
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
                      placeholder="e.g. Vinayak Developers"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Possession by</Label>
                    <Input
                      value={possessionBy}
                      onChange={(e) => setPossessionBy(e.target.value)}
                      placeholder="Dec, 2027"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Construction status</Label>
                    <Select
                      value={constructionStatus || undefined}
                      onValueChange={setConstructionStatus}
                    >
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONSTRUCTION_STATUS_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Current status</Label>
                    <Select
                      value={currentStatus || undefined}
                      onValueChange={setCurrentStatus}
                    >
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder="Select current status" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENT_STATUS_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                </div>

                <div className="space-y-2">
                  <Label>Parking types</Label>
                  <ChipGroup>
                    {PARKING_OPTIONS.map((opt) => (
                      <ChipToggle
                        key={opt}
                        selected={parkingTypes.includes(opt)}
                        onClick={() =>
                          toggleMulti(parkingTypes, opt, setParkingTypes)
                        }
                      >
                        {opt}
                      </ChipToggle>
                    ))}
                  </ChipGroup>
                </div>

                <div className="space-y-2">
                  <Label>About</Label>
                  <Textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    rows={5}
                    placeholder="Project description shown on the detail page…"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* PRICING */}
        <TabsContent value="pricing">
          <motion.div {...cardMotion(0)}>
            <Card>
              <CardHeader className="border-b border-slate-100 bg-[#eef1f6]/30">
                <CardTitle className="text-base text-[#16233f]">
                  Rate card
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                <RateCardsEditor
                  key={`${propertyId}-${detail?.updated_at ?? "new"}`}
                  value={rateCards}
                  onChange={setRateCards}
                  rangeLabel={priceRangeLabel}
                  onRangeChange={setPriceRangeLabel}
                  lockRangeInitially={lockPriceRange}
                />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* FLOOR PLANS */}
        <TabsContent value="plans" className="space-y-4">
          <motion.div
            {...cardMotion(0)}
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm text-slate-500">
              Add configs like &ldquo;3 BHK Type 1&rdquo; with area and price.
            </p>
            <div className="flex gap-2">
              <input
                ref={plansInputRef}
                type="file"
                accept={ACCEPT_IMG}
                multiple
                className="hidden"
                onChange={(e) => {
                  void handleFloorPlansBulkUpload(e.target.files);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                loading={uploadingPlans}
                onClick={() => plansInputRef.current?.click()}
              >
                {!uploadingPlans && <ImagePlus className="size-4" />}
                {uploadingPlans ? "Uploading…" : "Upload images"}
              </Button>
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
          </motion.div>

          {floorPlans.length === 0 ? (
            <motion.div {...cardMotion(1)}>
              <Card>
                <CardContent className="py-10">
                  <EmptyState
                    title="No floor plans yet"
                    description="Add your first configuration to show area and price breakdowns."
                  />
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            floorPlans.map((plan, index) => (
              <motion.div key={plan.id ?? `new-${index}`} {...cardMotion(index + 1)}>
                <Card>
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
                      <Label>Floor plan image</Label>
                      <div className="max-w-xs">
                        <ImageUploadField
                          previewUrl={plan.image_url}
                          placeholder={
                            <ImagePlus className="h-6 w-6 text-slate-400" />
                          }
                          accept={ACCEPT_IMG}
                          emptyLabel="Upload floor plan"
                          aspect="wide"
                          onPick={(file) => void handleFloorPlanUpload(index, file)}
                          onRemove={() => {
                            setFloorPlans((prev) =>
                              prev.map((p, i) =>
                                i === index
                                  ? {
                                      ...p,
                                      image_url: null,
                                      cloudinary_public_id: null,
                                    }
                                  : p,
                              ),
                            );
                          }}
                          onPreview={
                            plan.image_url
                              ? () => setPreviewImage(plan.image_url as string)
                              : undefined
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* MEDIA */}
        <TabsContent value="media" className="space-y-4">
          <motion.div {...cardMotion(0)}>
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
                    loading={uploadingGallery}
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    {!uploadingGallery && <ImagePlus className="size-4" />}
                    {uploadingGallery ? "Uploading…" : "Add photos"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {detail.media.length === 0 ? (
                  <EmptyState
                    icon={ImagePlus}
                    title="No gallery images yet"
                    description="Upload photos to build out the property gallery."
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {detail.media.map((m) => (
                      <div
                        key={m.id}
                        className="group relative aspect-4/3 overflow-hidden rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(16,25,46,0.03)]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.image_url}
                          alt=""
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100">
                          <button
                            type="button"
                            className="rounded-full bg-white/90 p-1.5 text-slate-700 shadow transition-colors hover:bg-white"
                            onClick={() => setPreviewImage(m.image_url)}
                            aria-label="Preview image"
                          >
                            <Eye className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            className="rounded-full bg-white/90 p-1.5 text-red-600 shadow transition-colors hover:bg-white"
                            onClick={() => {
                              void deletePropertyMedia(m.id).then(() => {
                                setDetail((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        media: prev.media.filter(
                                          (x) => x.id !== m.id,
                                        ),
                                      }
                                    : prev,
                                );
                              });
                            }}
                            aria-label="Remove image"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* AMENITIES */}
        <TabsContent value="amenities">
          <motion.div {...cardMotion(0)}>
            <Card>
              <CardHeader className="border-b border-slate-100 bg-[#eef1f6]/30">
                <CardTitle className="text-base text-[#16233f]">
                  Amenities
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                <AmenityPicker
                  amenities={amenities}
                  selectedIds={selectedAmenityIds}
                  onSelectedChange={setSelectedAmenityIds}
                  onAmenitiesChange={setAmenities}
                />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* CONTENT */}
        <TabsContent value="content" className="space-y-4">
          <motion.div {...cardMotion(0)}>
            <Card>
              <CardHeader className="border-b border-slate-100 bg-[#eef1f6]/30">
                <CardTitle className="text-base text-[#16233f]">
                  Why this project
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                <InlineTextRows
                  label="Highlights"
                  hint="Short reasons buyers should choose this project."
                  placeholder="Club-class amenities with prime location access…"
                  value={highlightRows}
                  onChange={setHighlightRows}
                  addLabel="Add highlight"
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div {...cardMotion(1)}>
            <Card>
              <CardHeader className="border-b border-slate-100 bg-[#eef1f6]/30">
                <CardTitle className="text-base text-[#16233f]">
                  Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                <LabelValueRows
                  title="Spec fields"
                  hint="Add label + value pairs (not a popup)."
                  value={specRows}
                  onChange={setSpecRows}
                  addLabel="Add field"
                  labelPlaceholder="e.g. Flooring"
                  valuePlaceholder="e.g. Wooden finish vitrified tiles"
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div {...cardMotion(2)}>
            <Card>
              <CardHeader className="border-b border-slate-100 bg-[#eef1f6]/30">
                <CardTitle className="text-base text-[#16233f]">
                  FAQs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                <FaqAccordionEditor value={faqRows} onChange={setFaqRows} />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="sticky bottom-4 z-10 flex justify-center sm:justify-end"
      >
        <div className="glass-card flex items-center gap-2.5 rounded-2xl p-2 pl-4 shadow-[0_8px_30px_rgba(16,25,46,0.14)]">
          <span className="hidden text-xs font-medium text-slate-500 sm:inline">
            Step {activeTabIndex + 1} of {EDIT_TABS.length}
          </span>
          <Button
            variant="outline"
            className="gap-2"
            loading={saving}
            onClick={() => void handleSave()}
          >
            {!saving && <Save className="size-4" />}
            {saving ? "Saving…" : "Save"}
          </Button>
          {isLastTab ? (
            <Button
              className="gap-2"
              loading={saving}
              onClick={() => void handleSaveAndFinish()}
            >
              {!saving && <Check className="size-4" />}
              Save &amp; finish
            </Button>
          ) : (
            <Button
              className="gap-2"
              loading={saving}
              onClick={() => void handleSaveAndNext()}
            >
              Save &amp; next
              {!saving && <ArrowRight className="size-4" />}
            </Button>
          )}
        </div>
      </motion.div>

      {previewImage && (
        <ImagePreviewOverlay
          src={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}
