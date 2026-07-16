"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProperty } from "@/lib/properties-api";
import { listStaticOptions } from "@/lib/static-options-api";
import type { EntityItem } from "@/lib/static-options";
import { buildPropertySlug } from "@/lib/properties";

export function NewPropertyPageContent() {
  const router = useRouter();
  const [areas, setAreas] = useState<EntityItem[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [areaId, setAreaId] = useState("");
  const [title, setTitle] = useState("");
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("Gandhinagar");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listStaticOptions("area")
      .then((rows) => {
        if (cancelled) return;
        setAreas(rows.filter((a) => a.status === "active"));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load areas. Add areas under Customization first.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingAreas(false);
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
    const area = areas.find((a) => a.id === id);
    if (!area) return;
    setLocality((prev) => {
      const previousArea = areas.find((a) => a.id === areaId);
      if (!prev || (previousArea && prev === previousArea.name)) {
        return area.name;
      }
      return prev;
    });
  };

  const canContinue = Boolean(areaId && title.trim());

  const handleCreate = async () => {
    if (!selectedArea || !title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createProperty({
        title: title.trim(),
        area_id: selectedArea.id,
        area_name: selectedArea.name,
        locality: locality.trim() || selectedArea.name,
        city: city.trim() || "Gandhinagar",
        status: "draft",
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
        <Button asChild variant="ghost" className="-ml-2 mb-2 gap-1.5 text-slate-500">
          <Link href="/customization/properties">
            <ArrowLeft className="size-4" />
            Back to properties
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1a2744]">
          Add property
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Step 1 — select the area, then enter the project name. Full details
          (gallery, rate card, floor plans, RERA, etc.) come next.
        </p>
      </div>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <MapPin className="size-4 text-[#1a2744]" />
            Location &amp; identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="area">
              Area <span className="text-red-500">*</span>
            </Label>
            {loadingAreas ? (
              <p className="text-sm text-slate-500">Loading areas…</p>
            ) : areas.length === 0 ? (
              <p className="text-sm text-amber-700">
                No active areas found.{" "}
                <Link
                  href="/customization/areas"
                  className="font-medium underline underline-offset-2"
                >
                  Add an area
                </Link>{" "}
                first, then come back.
              </p>
            ) : (
              <Select
                value={areaId || undefined}
                onValueChange={handleAreaChange}
              >
                <SelectTrigger id="area" className="w-full">
                  <SelectValue placeholder="Select area (e.g. Kudasan)" />
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
                placeholder="Locality within area"
                disabled={!areaId}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!areaId}
              />
            </div>
          </div>

          {previewSlug ? (
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              URL slug preview:{" "}
              <span className="font-mono text-[#1a2744]">/{previewSlug}</span>
            </div>
          ) : null}

          <div className="flex justify-end pt-2">
            <Button
              className="gap-2 bg-[#1a2744] hover:bg-[#243356]"
              disabled={!canContinue || submitting}
              onClick={() => void handleCreate()}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating…
                </>
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
    </div>
  );
}
