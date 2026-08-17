"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Check, Info, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertBanner } from "@/components/ui/alert-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  listProperties,
  setHeroBannerProperties,
} from "@/lib/properties-api";
import type { Property } from "@/lib/properties";

const PAGE_SIZE = 10;

export function MainBannerPageContent() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [initialIds, setInitialIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listProperties();
      const withBanner = rows.filter((p) => Boolean(p.hero_banner_url?.trim()));
      setProperties(withBanner);
      const selected = withBanner
        .filter((p) => p.is_hero_banner)
        .map((p) => p.id);
      setSelectedIds(selected);
      setInitialIds(selected);
      setPage(1);
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  const dirty =
    selectedIds.length !== initialIds.length ||
    selectedIds.some((id) => !initialIds.includes(id));

  const toggle = (id: string) => {
    setMessage(null);
    setError(null);
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) {
          setError("Keep at least one property banner selected for the homepage.");
          return prev;
        }
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  };

  const handleSave = async () => {
    if (selectedIds.length < 1) {
      setError("Select at least one property banner for the homepage.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await setHeroBannerProperties(selectedIds);
      setInitialIds([...selectedIds]);
      setProperties((prev) =>
        prev.map((p) => ({
          ...p,
          is_hero_banner: selectedIds.includes(p.id),
        })),
      );
      setMessage(
        `${selectedIds.length} banner${selectedIds.length === 1 ? "" : "s"} set for the homepage carousel.`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update homepage banners.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 min-[380px]:space-y-6">
      <PageHeader
        eyebrow="Homepage"
        title="Main Banner"
        description="Choose which property banners appear in the homepage hero. Multiple banners rotate every 5 seconds."
        actions={
          <Button
            className="w-full gap-2 min-[380px]:w-auto"
            loading={saving}
            disabled={!dirty || loading || selectedIds.length < 1}
            onClick={() => void handleSave()}
          >
            {!saving && <Check className="size-4" />}
            {saving ? "Saving…" : "Save banners"}
          </Button>
        }
      />

      {error ? <AlertBanner variant="error">{error}</AlertBanner> : null}
      {message ? <AlertBanner variant="success">{message}</AlertBanner> : null}

      <Card className="overflow-hidden border-slate-200/80 shadow-[0_4px_24px_rgba(16,25,46,0.05)]">
        <CardHeader className="flex flex-col gap-3 border-b border-slate-100 bg-[#eef1f6]/40 min-[380px]:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base text-[#16233f]">
              Property banners
              <span className="group relative inline-flex">
                <button
                  type="button"
                  className="inline-flex size-6 items-center justify-center rounded-full bg-[#16233f]/8 text-[#16233f] transition hover:bg-[#16233f]/15"
                  aria-label="Banner selection info"
                >
                  <Info className="size-3.5" strokeWidth={2.2} />
                </button>
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-[min(18rem,78vw)] rounded-xl border border-slate-200 bg-white p-3 text-left text-[12px] leading-relaxed text-slate-600 opacity-0 shadow-[0_12px_32px_rgba(16,25,46,0.14)] transition group-hover:opacity-100 group-focus-within:opacity-100 sm:left-1/2 sm:-translate-x-1/2"
                >
                  Only properties with a homepage banner image (uploaded in
                  Property edit) appear here. Select at least one. On the
                  website, one slide shows if a single banner is selected;
                  multiple slides rotate every 5 seconds. Click opens that
                  property. Upload{" "}
                  <strong className="font-semibold text-slate-800">
                    1920×800
                  </strong>{" "}
                  (or 1920×720). Keep names, towers, and logos in the centre —
                  edges crop on mobile.
                </span>
              </span>
            </CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              {selectedIds.length} selected · {filtered.length} with banners
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
            <div className="space-y-3 p-4 min-[380px]:p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 min-[380px]:p-8">
              <EmptyState
                title={
                  properties.length === 0
                    ? "No property banners yet"
                    : "No matches"
                }
                description={
                  properties.length === 0
                    ? "Open a property → upload a Homepage banner (1920×800), then return here to select it for the hero."
                    : "Try a different search."
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pageItems.map((property, index) => {
                const checked = selectedIds.includes(property.id);
                const bannerSrc =
                  property.hero_banner_url || property.cover_image_url;

                return (
                  <motion.li
                    key={property.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index, 10) * 0.02 }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggle(property.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggle(property.id);
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
                          onChange={() => toggle(property.id)}
                          aria-label={`Show ${property.title} on homepage`}
                        />
                      </span>

                      <div className="relative h-12 w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/80 min-[380px]:h-14 min-[380px]:w-24">
                        {bannerSrc ? (
                          <Image
                            src={bannerSrc}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="96px"
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
                          {property.is_hero_banner ? (
                            <Badge
                              variant="premium"
                              className="text-[10px]"
                            >
                              On homepage
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
                        </p>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </CardContent>

        {!loading && filtered.length > 0 ? (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-3 py-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between min-[380px]:px-5">
            <p className="text-xs text-slate-500">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="min-w-[4.5rem] text-center text-xs font-medium text-slate-600">
                {safePage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <div className="sticky bottom-3 z-10 flex justify-stretch sm:bottom-4 sm:justify-end">
        <div className="glass-card flex w-full items-center justify-between gap-3 rounded-2xl p-2 shadow-[0_8px_30px_rgba(16,25,46,0.14)] sm:w-auto">
          <p className="px-2 text-xs text-slate-500">
            {selectedIds.length} selected · min 1
          </p>
          <Button
            className="gap-2"
            loading={saving}
            disabled={!dirty || loading || selectedIds.length < 1}
            onClick={() => void handleSave()}
          >
            {!saving && <Check className="size-4" />}
            {saving ? "Saving…" : "Save banners"}
          </Button>
        </div>
      </div>
    </div>
  );
}
