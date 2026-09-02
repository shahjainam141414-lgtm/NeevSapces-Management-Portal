"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertBanner } from "@/components/ui/alert-banner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BuilderSelectField } from "@/components/properties/builder-select-field";
import { createProperty } from "@/lib/properties-api";
import { listBuilders } from "@/lib/builders-api";
import { listStaticOptions } from "@/lib/static-options-api";
import type { Builder } from "@/lib/builders";
import type { EntityItem } from "@/lib/static-options";
import { buildPropertySlug } from "@/lib/properties";

export function NewPropertyPageContent() {
  const router = useRouter();
  const [areas, setAreas] = useState<EntityItem[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<EntityItem[]>([]);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [areaId, setAreaId] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [builderIds, setBuilderIds] = useState<string[]>([]);
  const [developerName, setDeveloperName] = useState("");
  const [title, setTitle] = useState("");
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      listStaticOptions("area"),
      listStaticOptions("property_type"),
      listBuilders(),
    ])
      .then(([areaRows, typeRows, builderRows]) => {
        if (cancelled) return;
        setAreas(areaRows.filter((a) => a.status === "active"));
        setPropertyTypes(typeRows.filter((t) => t.status === "active"));
        setBuilders(builderRows);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load options. Add areas & property types under Customization first.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedArea = useMemo(
    () => areas.find((a) => a.id === areaId) ?? null,
    [areas, areaId],
  );

  const previewSlug = useMemo(() => {
    if (!title.trim()) return "";
    return buildPropertySlug(title, selectedArea?.name ?? null);
  }, [title, selectedArea]);

  const handleAreaChange = (id: string) => {
    setAreaId(id);
  };

  const canContinue = Boolean(areaId && propertyType && title.trim());

  const handleCreate = async () => {
    if (!selectedArea || !title.trim() || !propertyType) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createProperty({
        title: title.trim(),
        area_id: selectedArea.id,
        area_name: selectedArea.name,
        locality: locality.trim() || selectedArea.name,
        city: city.trim() || "Gandhinagar",
        property_type_label: propertyType,
        builder_id: builderIds[0] || null,
        builder_ids: builderIds,
        developer_name: developerName.trim() || null,
        status: "active",
      });
      router.push(`/customization/properties/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create property");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button
          asChild
          variant="ghost"
          className="-ml-2 mb-3 gap-1.5 text-slate-500"
        >
          <Link href="/customization/properties">
            <ArrowLeft className="size-4" />
            Back to properties
          </Link>
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#16233f] via-[#1a2a4a] to-[#243556] p-6 text-white shadow-[0_12px_40px_rgba(16,25,46,0.2)] sm:p-8"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
            New listing
          </p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Add property
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/70">
            Create a draft with location, builder, and name, then fill rate
            cards, amenities, specs, and FAQs on the next screen.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/20">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#16233f]">
                1
              </span>
              Create draft
            </span>
            <span className="text-white/40">→</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-white/55 ring-1 ring-white/10">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                2
              </span>
              Full details
            </span>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="overflow-hidden border-slate-200/80 shadow-[0_4px_24px_rgba(16,25,46,0.06)]">
          <CardHeader className="border-b border-slate-100 bg-[#eef1f6]/40">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#16233f]">
              <MapPin className="size-4" />
              Location &amp; identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-5 sm:p-6">
            {error ? <AlertBanner variant="error">{error}</AlertBanner> : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="area">
                  Area <span className="text-red-500">*</span>
                </Label>
                {loadingOptions ? (
                  <p className="text-sm text-slate-500">Loading…</p>
                ) : areas.length === 0 ? (
                  <AlertBanner variant="warning">
                    No active areas.{" "}
                    <Link
                      href="/customization/areas"
                      className="font-medium underline underline-offset-2"
                    >
                      Add an area
                    </Link>
                    .
                  </AlertBanner>
                ) : (
                  <Select
                    value={areaId || undefined}
                    onValueChange={handleAreaChange}
                  >
                    <SelectTrigger id="area" className="w-full cursor-pointer">
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="property-type">
                  Property type <span className="text-red-500">*</span>
                </Label>
                {loadingOptions ? (
                  <p className="text-sm text-slate-500">Loading…</p>
                ) : propertyTypes.length === 0 ? (
                  <AlertBanner variant="warning">
                    No types yet.{" "}
                    <Link
                      href="/customization/property-types"
                      className="font-medium underline underline-offset-2"
                    >
                      Add property types
                    </Link>
                    .
                  </AlertBanner>
                ) : (
                  <Select
                    value={propertyType || undefined}
                    onValueChange={setPropertyType}
                  >
                    <SelectTrigger
                      id="property-type"
                      className="w-full cursor-pointer"
                    >
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map((t) => (
                        <SelectItem key={t.id} value={t.name}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <BuilderSelectField
              builders={builders}
              value={builderIds}
              onBuildersChange={setBuilders}
              onChange={(ids, name) => {
                setBuilderIds(ids);
                setDeveloperName(name);
              }}
              disabled={loadingOptions}
              hint="Optional. Pick one or more brands, or add a new one."
            />

            <div className="space-y-2">
              <Label htmlFor="title">
                Project / property name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Privilon"
                disabled={!areaId}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="locality">Locality</Label>
                <Input
                  id="locality"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Kudasan"
                  disabled={!areaId}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Gandhinagar"
                  disabled={!areaId}
                />
              </div>
            </div>

            {previewSlug ? (
              <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-[#eef1f6]/50 px-3 py-2.5 text-xs text-slate-600">
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#16233f]/60" />
                <p>
                  URL slug preview:{" "}
                  <span className="font-mono font-medium text-[#16233f]">
                    /{previewSlug}
                  </span>
                </p>
              </div>
            ) : null}

            <div className="flex justify-end pt-1">
              <Button
                className="gap-2"
                disabled={!canContinue}
                loading={submitting}
                onClick={() => void handleCreate()}
              >
                {submitting ? (
                  "Creating…"
                ) : (
                  <>
                    Continue to details
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
