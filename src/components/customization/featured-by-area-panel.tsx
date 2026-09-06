"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronsUpDown, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertBanner } from "@/components/ui/alert-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { listProperties } from "@/lib/properties-api";
import { listStaticOptions } from "@/lib/static-options-api";
import {
  listAreaFeaturedCounts,
  listAreaFeaturedPropertyIds,
  setAreaFeaturedProperties,
} from "@/lib/area-featured-api";
import type { Property } from "@/lib/properties";
import type { EntityItem } from "@/lib/static-options";
import { PropertyPickList } from "@/components/customization/featured-homepage-panel";

function AreaCombobox({
  areas,
  counts,
  value,
  onChange,
  disabled = false,
}: {
  areas: EntityItem[];
  counts: Record<string, number>;
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const fieldId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => areas.find((a) => a.id === value) ?? null,
    [areas, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return areas;
    return areas.filter((a) => a.name.toLowerCase().includes(q));
  }, [areas, query]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
      setQuery("");
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => searchRef.current?.focus(), 10);
    return () => window.clearTimeout(t);
  }, [open]);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        id={fieldId}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => {
            const next = !prev;
            if (!next) setQuery("");
            return next;
          });
        }}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-left text-sm shadow-[0_1px_2px_rgba(16,25,46,0.03)] transition",
          open
            ? "border-[#16233f]/40 ring-4 ring-[#16233f]/10"
            : "hover:border-slate-300",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            selected ? "text-slate-900" : "text-slate-400",
          )}
        >
          {selected?.name ?? "Select area"}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-slate-400" />
      </button>

      {open ? (
        <div
          role="listbox"
          data-lenis-prevent
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(16,25,46,0.14)]"
          onMouseDown={(event) => {
            // Keep focus in search; don't blur/collapse on option press.
            event.preventDefault();
          }}
        >
          <div className="relative shrink-0 border-b border-slate-100 bg-white">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Search areas…"
              className="h-10 w-full bg-transparent pl-9 pr-3 text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="scrollbar-thin max-h-56 overflow-y-auto overscroll-contain p-1.5">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-slate-500">
                {areas.length === 0
                  ? "No areas available."
                  : "No areas match your search."}
              </p>
            ) : (
              filtered.map((area) => {
                const active = area.id === value;
                const count = counts[area.id] ?? 0;
                return (
                  <button
                    key={area.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => pick(area.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition",
                      active
                        ? "bg-[#16233f]/6 font-medium text-[#16233f]"
                        : "text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-4 shrink-0 place-items-center rounded border",
                        active
                          ? "border-[#16233f] bg-[#16233f] text-white"
                          : "border-slate-300 bg-white",
                      )}
                    >
                      {active ? (
                        <Check className="size-2.5" strokeWidth={3} />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{area.name}</span>
                    {count > 0 ? (
                      <span className="shrink-0 text-xs text-slate-400">
                        {count}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function FeaturedByAreaPanel() {
  const [areas, setAreas] = useState<EntityItem[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [areaId, setAreaId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [initialIds, setInitialIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingArea, setLoadingArea] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadBase = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [areaRows, propertyRows, featuredCounts] = await Promise.all([
        listStaticOptions("area"),
        listProperties(),
        listAreaFeaturedCounts(),
      ]);
      const activeAreas = areaRows
        .filter((a) => a.status === "active")
        .sort((a, b) => a.name.localeCompare(b.name));
      setAreas(activeAreas);
      setProperties(propertyRows);
      setCounts(featuredCounts);
      setAreaId((current) => current || activeAreas[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      setAreas([]);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBase();
  }, [loadBase]);

  const loadAreaSelection = useCallback(async (id: string) => {
    if (!id) {
      setSelectedIds([]);
      setInitialIds([]);
      return;
    }
    setLoadingArea(true);
    setError(null);
    setMessage(null);
    try {
      const ids = await listAreaFeaturedPropertyIds(id);
      setSelectedIds(ids);
      setInitialIds(ids);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load area featured list",
      );
      setSelectedIds([]);
      setInitialIds([]);
    } finally {
      setLoadingArea(false);
    }
  }, []);

  useEffect(() => {
    if (!areaId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAreaSelection(areaId);
  }, [areaId, loadAreaSelection]);

  const selectedArea = useMemo(
    () => areas.find((a) => a.id === areaId) ?? null,
    [areas, areaId],
  );

  const areaProperties = useMemo(() => {
    if (!areaId) return [];
    return properties.filter((p) => p.area_id === areaId);
  }, [properties, areaId]);

  const filteredProperties = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return areaProperties;
    return areaProperties.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.locality ?? "").toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q),
    );
  }, [areaProperties, search]);

  const dirty =
    selectedIds.length !== initialIds.length ||
    selectedIds.some((id) => !initialIds.includes(id));

  const toggle = (id: string) => {
    setMessage(null);
    setError(null);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (!areaId) {
      setError("Select an area first.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await setAreaFeaturedProperties(areaId, selectedIds);
      setInitialIds([...selectedIds]);
      setCounts((prev) => ({ ...prev, [areaId]: selectedIds.length }));
      setMessage(
        selectedIds.length === 0
          ? `Cleared featured list for ${selectedArea?.name ?? "this area"}.`
          : `${selectedIds.length} featured for ${selectedArea?.name ?? "area"}.`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save area featured list.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error ? <AlertBanner variant="error">{error}</AlertBanner> : null}
      {message ? <AlertBanner variant="success">{message}</AlertBanner> : null}

      <Card className="overflow-visible border-slate-200/80 shadow-[0_4px_24px_rgba(16,25,46,0.05)]">
        <CardHeader className="relative z-20 space-y-4 overflow-visible rounded-t-[inherit] border-b border-slate-100 bg-[#eef1f6]/40">
          <div>
            <CardTitle className="flex items-center gap-2 text-base text-[#16233f]">
              <MapPin className="size-4 text-[#16233f]" />
              Featured by area
            </CardTitle>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-700">Area</Label>
              <AreaCombobox
                areas={areas}
                counts={counts}
                value={areaId}
                disabled={loading || areas.length === 0}
                onChange={(id) => {
                  setSearch("");
                  setAreaId(id);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Search listings</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search in this area…"
                  className="h-11 pl-9"
                  disabled={!areaId}
                />
              </div>
            </div>
          </div>

          {areaId ? (
            <p className="text-xs text-slate-500">
              {selectedArea?.name ?? "Area"} · {selectedIds.length} selected
              {dirty ? " · unsaved changes" : ""}
              {areaProperties.length
                ? ` · ${areaProperties.length} listing${areaProperties.length === 1 ? "" : "s"} in area`
                : ""}
            </p>
          ) : null}
        </CardHeader>

        <CardContent className="p-0">
          {loading || loadingArea ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : !areaId ? (
            <div className="p-8">
              <EmptyState
                title="Select an area"
                description="Pick an area above to curate its featured properties."
              />
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No properties in this area"
                description={
                  areaProperties.length === 0
                    ? "Assign properties to this area under Properties, then come back here."
                    : "Try a different search."
                }
              />
            </div>
          ) : (
            <PropertyPickList
              properties={filteredProperties}
              selectedIds={selectedIds}
              onToggle={toggle}
            />
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-3 z-10 flex justify-stretch sm:bottom-4 sm:justify-end">
        <div className="glass-card flex w-full items-center justify-between gap-3 rounded-2xl p-2 shadow-[0_8px_30px_rgba(16,25,46,0.14)] sm:w-auto">
          <p className="px-2 text-xs text-slate-500">
            {selectedIds.length} selected
            {selectedArea ? ` · ${selectedArea.name}` : ""}
          </p>
          <Button
            className="gap-2"
            loading={saving}
            disabled={!dirty || loading || loadingArea || !areaId}
            onClick={() => void handleSave()}
          >
            {!saving && <Check className="size-4" />}
            {saving ? "Saving…" : "Save for area"}
          </Button>
        </div>
      </div>
    </div>
  );
}
