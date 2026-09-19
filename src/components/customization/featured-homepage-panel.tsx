"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Check, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertBanner } from "@/components/ui/alert-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { listProperties, setFeaturedProperties } from "@/lib/properties-api";
import type { Property } from "@/lib/properties";
import { usePagedList } from "@/hooks/use-paged-list";
import { AdminPagination } from "@/components/ui/admin-pagination";

export function FeaturedHomepagePanel() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [initialIds, setInitialIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listProperties();
      setProperties(rows);
      const featured = rows.filter((p) => p.is_featured).map((p) => p.id);
      setSelectedIds(featured);
      setInitialIds(featured);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load properties",
      );
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.area_name ?? "").toLowerCase().includes(q) ||
        (p.locality ?? "").toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q),
    );
  }, [properties, search]);

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
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await setFeaturedProperties(selectedIds);
      setInitialIds([...selectedIds]);
      setProperties((prev) =>
        prev.map((p) => ({
          ...p,
          is_featured: selectedIds.includes(p.id),
        })),
      );
      setMessage(
        selectedIds.length === 0
          ? "Featured list cleared."
          : `${selectedIds.length} propert${selectedIds.length === 1 ? "y" : "ies"} set as featured.`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update featured list.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error ? <AlertBanner variant="error">{error}</AlertBanner> : null}
      {message ? <AlertBanner variant="success">{message}</AlertBanner> : null}

      <Card className="overflow-hidden border-slate-200/80 shadow-[0_4px_24px_rgba(16,25,46,0.05)]">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 bg-[#eef1f6]/40 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base text-[#16233f]">
              <Star className="size-4 text-[#16233f]" />
              Homepage featured
            </CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              {selectedIds.length} selected
              {dirty ? " · unsaved changes" : ""}
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or area…"
              className="pl-9"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No properties found"
                description={
                  properties.length === 0
                    ? "Add properties under Customization → Properties first."
                    : "Try a different search."
                }
              />
            </div>
          ) : (
            <PropertyPickList
              properties={filtered}
              selectedIds={selectedIds}
              onToggle={toggle}
              badgeWhenFeatured
            />
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-3 z-10 flex justify-stretch sm:bottom-4 sm:justify-end">
        <div className="glass-card flex w-full items-center justify-between gap-3 rounded-2xl p-2 shadow-[0_8px_30px_rgba(16,25,46,0.14)] sm:w-auto">
          <p className="px-2 text-xs text-slate-500">
            {selectedIds.length} selected
          </p>
          <Button
            className="gap-2"
            loading={saving}
            disabled={!dirty || loading}
            onClick={() => void handleSave()}
          >
            {!saving && <Check className="size-4" />}
            {saving ? "Saving…" : "Set featured"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PropertyPickList({
  properties,
  selectedIds,
  onToggle,
  badgeWhenFeatured = false,
}: {
  properties: Property[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  badgeWhenFeatured?: boolean;
}) {
  const pager = usePagedList(
    properties,
    `${properties.length}:${properties[0]?.id ?? ""}:${properties[properties.length - 1]?.id ?? ""}`,
  );

  return (
    <>
    <ul className="divide-y divide-slate-100">
      {pager.pageItems.map((property, index) => {
        const checked = selectedIds.includes(property.id);

        return (
          <motion.li
            key={property.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index, 12) * 0.02 }}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => onToggle(property.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggle(property.id);
                }
              }}
              className={cn(
                "flex cursor-pointer items-start gap-2.5 px-3 py-3 transition-colors min-[380px]:items-center min-[380px]:gap-3 min-[380px]:px-4 min-[380px]:py-3.5 sm:gap-4 sm:px-5",
                checked ? "bg-[#eef1f6]/70" : "hover:bg-slate-50/80",
              )}
            >
              <span
                className="mt-0.5 min-[380px]:mt-0"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={checked}
                  onChange={() => onToggle(property.id)}
                  aria-label={`Feature ${property.title}`}
                />
              </span>

              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/80 min-[380px]:h-12 min-[380px]:w-12">
                {property.cover_image_url ? (
                  <Image
                    src={property.cover_image_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] font-medium text-slate-400">
                    N/A
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 min-[380px]:gap-2">
                  <p className="max-w-full truncate text-[13px] font-semibold text-slate-900 min-[380px]:text-sm">
                    {property.title}
                  </p>
                  {badgeWhenFeatured && property.is_featured ? (
                    <Badge variant="premium" className="gap-1 text-[10px]">
                      <Star className="size-2.5 fill-current" />
                      Featured
                    </Badge>
                  ) : null}
                  <StatusBadge
                    status={property.status}
                    className="text-[10px]"
                  />
                </div>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500 min-[380px]:truncate min-[380px]:text-xs">
                  {[property.area_name, property.locality, property.city]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                  {property.package_price_label
                    ? ` · ${property.package_price_label}`
                    : ""}
                </p>
              </div>
            </div>
          </motion.li>
        );
      })}
    </ul>
    <AdminPagination
      page={pager.page}
      totalPages={pager.totalPages}
      from={pager.from}
      to={pager.to}
      total={pager.total}
      onPageChange={pager.setPage}
    />
    </>
  );
}
