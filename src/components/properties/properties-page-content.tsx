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
      <div className="lux-card overflow-hidden">
        <div className="gap-4 border-b border-[var(--border)] bg-gradient-to-b from-[var(--surface)] to-white px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="type-caption text-[var(--accent)]">Catalog</p>
              <h1 className="font-display type-section mt-1 text-xl text-[var(--ink)] sm:text-2xl">
                Properties
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {loading
                  ? "Loading listings…"
                  : `${counts.all} listings · ${counts.featured} featured on homepage`}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              <div className="relative w-full sm:w-56 lg:w-64">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title, area, slug…"
                  className="h-10 border-[var(--border)] bg-white pl-9 shadow-none"
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

          <div className="mt-4 flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                  statusFilter === f.id
                    ? "bg-[var(--ink)] text-white shadow-[0_6px_18px_rgba(20,32,51,0.2)]"
                    : "bg-white text-[var(--muted)] ring-1 ring-[var(--border)] hover:bg-[var(--surface)] hover:text-[var(--ink)]",
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] tabular-nums",
                    statusFilter === f.id
                      ? "bg-white/15 text-white"
                      : "bg-[var(--surface)] text-[var(--muted)]",
                  )}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-0">
          {error ? (
            <div className="px-4 pt-4 sm:px-6">
              <AlertBanner variant="error">{error}</AlertBanner>
            </div>
          ) : null}

          {loading ? (
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-52 w-full rounded-lg" />
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
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(index, 12) * 0.03,
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="lux-card lux-card-hover group flex flex-col overflow-hidden"
                >
                  <button
                    type="button"
                    className="relative aspect-[16/10] w-full cursor-pointer overflow-hidden bg-[var(--surface)]"
                    onClick={() =>
                      router.push(`/customization/properties/${item.id}`)
                    }
                  >
                    {item.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.cover_image_url}
                        alt=""
                        className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                      />
                    ) : (
                      <div className="flex size-full flex-col items-center justify-center gap-2 text-[var(--muted-foreground)]">
                        <Building2 className="size-8 opacity-50" />
                        <span className="text-[11px] font-medium">No cover</span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--ink-deep)]/55 to-transparent" />
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                      <StatusBadge
                        status={item.status}
                        className="bg-white/95 backdrop-blur-sm"
                      />
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
                    {item.property_type_label ? (
                      <span className="absolute right-2.5 bottom-2.5 rounded bg-[var(--ink-deep)]/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur-sm">
                        {item.property_type_label}
                      </span>
                    ) : null}
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
                        <h3 className="font-display type-title line-clamp-2 text-sm text-[var(--ink)]">
                          {item.title}
                        </h3>
                        <p className="mt-1 flex items-center gap-1 truncate text-xs text-[var(--muted)]">
                          <MapPin className="size-3 shrink-0 opacity-60" />
                          {item.area_name || item.locality || item.city || "—"}
                        </p>
                      </button>
                      {propertyActions(item)}
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
                      <p className="truncate text-sm font-semibold text-[var(--ink)]">
                        {item.package_price_label || "Price on request"}
                      </p>
                      <p className="truncate text-[10px] font-medium text-[var(--muted-foreground)]">
                        /{item.slug}
                      </p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </div>

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
