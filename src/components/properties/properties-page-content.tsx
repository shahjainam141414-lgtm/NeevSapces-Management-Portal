"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Inbox, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ActionsDropdown } from "@/components/ui/actions-dropdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteProperty, listProperties } from "@/lib/properties-api";
import type { Property } from "@/lib/properties";

function statusBadge(status: Property["status"]) {
  if (status === "active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "draft") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

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

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-slate-200/70 bg-white/90 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <CardHeader className="gap-4 border-b border-slate-100/80 bg-gradient-to-b from-slate-50/80 to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              Properties
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading properties…"
                : `${filtered.length} listings — select area first, then add full details`}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, area, slug…"
                className="h-10 border-slate-200 bg-white pl-9 shadow-none"
              />
            </div>
            <Button asChild className="h-10 w-full shrink-0 sm:w-auto">
              <Link href="/customization/properties/new">
                <Plus className="size-4" />
                Add Property
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 py-4 sm:px-6">
          {error ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="py-12 text-center text-sm text-slate-500">Loading…</p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
              <Inbox className="size-10 opacity-40" />
              <p className="text-sm">No properties yet. Start by selecting an area.</p>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/customization/properties/new">
                  <Plus className="size-4" />
                  Add Property
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs tracking-wide text-slate-500 uppercase">
                    <th className="pb-3 font-medium">Property</th>
                    <th className="pb-3 font-medium">Area</th>
                    <th className="pb-3 font-medium">Price</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="py-3.5 pr-4">
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
                            <p className="truncate font-medium text-[#1a2744]">
                              {item.title}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                              /{item.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-slate-600">
                        {item.area_name ?? "—"}
                      </td>
                      <td className="py-3.5 pr-4 text-slate-600">
                        {item.package_price_label ?? "—"}
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="secondary"
                            className={statusBadge(item.status)}
                          >
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
                      <td className="py-3.5 text-right">
                        <ActionsDropdown
                          onEdit={() =>
                            router.push(`/customization/properties/${item.id}`)
                          }
                          onDelete={() => setDeleteItem(item)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
