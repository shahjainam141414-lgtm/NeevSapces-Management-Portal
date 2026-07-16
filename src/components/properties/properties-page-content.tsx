"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Inbox, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ActionsDropdown } from "@/components/ui/actions-dropdown";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteProperty, listProperties } from "@/lib/properties-api";
import { statusBadgeVariant, type Property } from "@/lib/properties";

export function PropertiesPageContent() {
  const router = useRouter();
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
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
    // Standard fetch-on-mount effect; loadItems' internal setLoading(true)
    // is what the rule flags, but this is the intentional initial load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadItems();
  }, [loadItems]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter(
      (item) =>
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.area_name ?? "").toLowerCase().includes(q) ||
        (item.locality ?? "").toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q),
    );
  }, [items, search]);

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

  const addPropertyAction = (
    <Button asChild className="h-10 w-full shrink-0 gap-2 sm:w-auto">
      <Link href="/customization/properties/new">
        <Plus className="size-4" />
        Add Property
      </Link>
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customization"
        title="Properties"
        description={
          loading
            ? "Loading properties…"
            : `${filtered.length} listings — select area first, then add full details`
        }
        actions={addPropertyAction}
      />

      <Card className="overflow-hidden border-slate-200/70 bg-white/90 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <CardHeader className="gap-4 border-b border-slate-100/80 bg-gradient-to-b from-slate-50/80 to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <CardTitle className="text-base font-semibold text-slate-900">
            All listings
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, area, slug…"
              className="h-10 border-slate-200 bg-white pl-9 shadow-none"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="px-4 pt-4 sm:px-6">
              <AlertBanner variant="error">{error}</AlertBanner>
            </div>
          ) : null}

          {loading ? (
            <>
              <div className="space-y-2.5 p-3 sm:hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3.5 py-3"
                  >
                    <Skeleton className="size-10 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden sm:block">
                <TableSkeleton rows={6} columns={5} />
              </div>
            </>
          ) : filtered.length === 0 ? (
            <div className="p-4 sm:p-6">
              <EmptyState
                icon={Inbox}
                title="No properties yet"
                description="Start by selecting an area, then add full listing details."
                action={
                  <Button asChild variant="outline" className="gap-2">
                    <Link href="/customization/properties/new">
                      <Plus className="size-4" />
                      Add Property
                    </Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="space-y-2.5 p-3 sm:hidden">
                {filtered.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-xl border border-slate-100 bg-white px-3.5 py-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                          {item.cover_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.cover_image_url}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            <Building2 className="size-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#16233f]">
                            {item.title}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            /{item.slug}
                          </p>
                        </div>
                      </div>
                      <ActionsDropdown
                        onEdit={() =>
                          router.push(`/customization/properties/${item.id}`)
                        }
                        onDelete={() => setDeleteItem(item)}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{item.area_name ?? "—"}</span>
                      <span>{item.package_price_label ?? "—"}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge variant={statusBadgeVariant(item.status)}>
                        {item.status}
                      </Badge>
                      {item.is_featured ? (
                        <Badge
                          variant="secondary"
                          className="border-sky-200 bg-sky-50 text-sky-700"
                        >
                          Featured
                        </Badge>
                      ) : null}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-auto sm:block sm:max-h-[70vh]">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] tracking-wide text-slate-500 uppercase">
                      <th className="px-6 py-3.5 font-semibold">Property</th>
                      <th className="px-6 py-3.5 font-semibold">Area</th>
                      <th className="px-6 py-3.5 font-semibold">Price</th>
                      <th className="px-6 py-3.5 font-semibold">Status</th>
                      <th className="px-4 py-3.5 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="border-b border-slate-50 transition-all duration-200 last:border-0 hover:-translate-y-px hover:bg-slate-50/80 hover:shadow-[0_4px_14px_rgba(16,25,46,0.06)]"
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                              {item.cover_image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.cover_image_url}
                                  alt=""
                                  className="size-full object-cover"
                                />
                              ) : (
                                <Building2 className="size-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-[#16233f]">
                                {item.title}
                              </p>
                              <p className="truncate text-xs text-slate-400">
                                /{item.slug}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          {item.area_name ?? "—"}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          {item.package_price_label ?? "—"}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant={statusBadgeVariant(item.status)}>
                              {item.status}
                            </Badge>
                            {item.is_featured ? (
                              <Badge
                                variant="secondary"
                                className="border-sky-200 bg-sky-50 text-sky-700"
                              >
                                Featured
                              </Badge>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <ActionsDropdown
                            onEdit={() =>
                              router.push(`/customization/properties/${item.id}`)
                            }
                            onDelete={() => setDeleteItem(item)}
                          />
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
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
    </div>
  );
}
