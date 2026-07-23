"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  Inbox,
  MapPin,
  Plus,
  Search,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ActionsDropdown } from "@/components/ui/actions-dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { deleteProperty, listProperties, updateProperty } from "@/lib/properties-api";
import type { Property, PropertyStatus } from "@/lib/properties";

type StatusFilter = "all" | PropertyStatus;

export function PropertiesPageContent() {
  const router = useRouter();
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteItem, setDeleteItem] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listProperties();
      setItems(rows);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load properties. Run 013_properties.sql in Supabase.",
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadItems();
  }, [loadItems]);

  const counts = useMemo(() => {
    return {
      all: items.length,
      active: items.filter((p) => p.status === "active").length,
      draft: items.filter((p) => p.status === "draft").length,
      inactive: items.filter((p) => p.status === "inactive").length,
      featured: items.filter((p) => p.is_featured).length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.area_name ?? "").toLowerCase().includes(q) ||
        (item.locality ?? "").toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q)
      );
    });
  }, [items, search, statusFilter]);

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await deleteProperty(deleteItem.id);
      setItems((prev) => prev.filter((p) => p.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleSetStatus = async (item: Property, status: PropertyStatus) => {
    if (item.status === status) return;
    setError(null);
    try {
      const updated = await updateProperty({ id: item.id, status });
      setItems((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update status.",
      );
    }
  };

  const propertyActions = (item: Property) => (
    <ActionsDropdown
      onEdit={() => router.push(`/customization/properties/${item.id}`)}
      onSetActive={
        item.status !== "active"
          ? () => void handleSetStatus(item, "active")
          : undefined
      }
      onSetInactive={
        item.status !== "inactive"
          ? () => void handleSetStatus(item, "inactive")
          : undefined
      }
      onDelete={() => setDeleteItem(item)}
    />
  );

  const filters: { id: StatusFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "active", label: "Active", count: counts.active },
    { id: "draft", label: "Draft", count: counts.draft },
    { id: "inactive", label: "Inactive", count: counts.inactive },
  ];

  return (
    <>
      <Card className="overflow-hidden border-slate-200/80 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <CardHeader className="gap-4 border-b border-slate-100/80 bg-gradient-to-b from-[#eef1f6]/80 to-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-lg font-semibold tracking-tight text-[#16233f] sm:text-xl">
                Properties
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? "Loading listings…"
                  : `${counts.all} listings · ${counts.featured} featured on homepage`}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              <div className="relative w-full sm:w-56 lg:w-64">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title, area, slug…"
                  className="h-10 border-slate-200 bg-white pl-9 shadow-none"
                />
              </div>
              <Button asChild className="h-10 w-full shrink-0 gap-2 sm:w-auto">
                <Link href="/customization/properties/new">
                  <Plus className="size-4" />
                  Add Property
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                  statusFilter === f.id
                    ? "bg-[#16233f] text-white shadow-[0_4px_14px_rgba(22,35,63,0.25)]"
                    : "bg-white text-slate-600 ring-1 ring-slate-200/90 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                    statusFilter === f.id
                      ? "bg-white/15 text-white"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error ? (
            <div className="px-4 pt-4 sm:px-6">
              <AlertBanner variant="error">{error}</AlertBanner>
            </div>
          ) : null}

          {loading ? (
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-52 w-full rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 sm:p-6">
              <EmptyState
                icon={Inbox}
                title="No properties found"
                description={
                  items.length === 0
                    ? "Start with area + title, then complete details step by step."
                    : "Try another search or status filter."
                }
                action={
                  items.length === 0 ? (
                    <Button asChild variant="outline" className="gap-2">
                      <Link href="/customization/properties/new">
                        <Plus className="size-4" />
                        Add Property
                      </Link>
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="grid gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-5 lg:grid-cols-3">
              {filtered.map((item, index) => (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(index, 12) * 0.03,
                    duration: 0.35,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(16,25,46,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-[0_12px_28px_rgba(16,25,46,0.08)]"
                >
                  <button
                    type="button"
                    className="relative aspect-[16/10] w-full cursor-pointer overflow-hidden bg-[#eef1f6]"
                    onClick={() =>
                      router.push(`/customization/properties/${item.id}`)
                    }
                  >
                    {item.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.cover_image_url}
                        alt=""
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex size-full flex-col items-center justify-center gap-2 text-slate-400">
                        <Building2 className="size-8 opacity-50" />
                        <span className="text-[11px] font-medium">No cover</span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#16233f]/55 to-transparent" />
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                      <StatusBadge status={item.status} className="bg-white/95 backdrop-blur-sm" />
                      {item.is_featured ? (
                        <Badge
                          variant="premium"
                          className="gap-1 bg-white/95 text-[10px] backdrop-blur-sm"
                        >
                          <Star className="size-2.5 fill-current" />
                          Featured
                        </Badge>
                      ) : null}
                    </div>
                  </button>

                  <div className="flex flex-1 flex-col gap-3 p-3.5 sm:p-4">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        className="min-w-0 cursor-pointer text-left"
                        onClick={() =>
                          router.push(`/customization/properties/${item.id}`)
                        }
                      >
                        <h3 className="line-clamp-2 text-sm font-semibold text-[#16233f] transition-colors group-hover:text-[#1f3157]">
                          {item.title}
                        </h3>
                        <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
                          <MapPin className="size-3 shrink-0 opacity-60" />
                          {item.area_name || item.locality || item.city || "—"}
                        </p>
                      </button>
                      {propertyActions(item)}
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <p className="truncate text-sm font-semibold text-[#16233f]">
                        {item.package_price_label || "Price on request"}
                      </p>
                      <p className="truncate text-[10px] font-medium text-slate-400">
                        /{item.slug}
                      </p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(deleteItem)}
        onOpenChange={(open) => !open && setDeleteItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete property?</DialogTitle>
            <DialogDescription>
              This removes &ldquo;{deleteItem?.title}&rdquo; and all floor plans,
              photos, FAQs, and linked amenities. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteItem(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={deleting}
              onClick={() => void handleDelete()}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
