"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Inbox,
  Plus,
  Search,
  Star,
  StarOff,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ActionsDropdown } from "@/components/ui/actions-dropdown";
import { AlertBanner } from "@/components/ui/alert-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { CardGridSkeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AmenityFormDialog } from "@/components/customization/amenity-form-dialog";
import { AmenityIcon } from "@/components/customization/amenity-icon";
import {
  createAmenity,
  deleteAmenity,
  listAmenities,
  setAmenitiesDefault,
  updateAmenity,
} from "@/lib/amenities-api";
import type { Amenity, AmenityStatus } from "@/lib/amenities";
import { cn } from "@/lib/utils";

type SelectMode = "set" | "unset" | null;

export function AmenitiesPageContent() {
  const [items, setItems] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Amenity | null>(null);
  const [deleteItem, setDeleteItem] = useState<Amenity | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [selectMode, setSelectMode] = useState<SelectMode>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listAmenities();
      setItems(rows);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load amenities. Run 005_amenities.sql and 012_amenities_is_default.sql in Supabase.",
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

  const filtered = useMemo(
    () =>
      items.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase()),
      ),
    [items, search],
  );

  const selectableFiltered = useMemo(() => {
    if (selectMode === "set") {
      return filtered.filter((item) => !item.is_default);
    }
    if (selectMode === "unset") {
      return filtered.filter((item) => item.is_default);
    }
    return [];
  }, [filtered, selectMode]);

  const selectedCount = selectedIds.size;
  const allSelectableSelected =
    selectableFiltered.length > 0 &&
    selectableFiltered.every((item) => selectedIds.has(item.id));

  const defaultCount = items.filter((i) => i.is_default).length;
  const nonDefaultCount = items.length - defaultCount;

  const startSelectMode = (mode: "set" | "unset") => {
    setSelectMode(mode);
    setSelectedIds(new Set());
    setConfirmOpen(false);
  };

  const exitSelectMode = () => {
    setSelectMode(null);
    setSelectedIds(new Set());
    setConfirmOpen(false);
  };

  const isSelectable = (item: Amenity) => {
    if (selectMode === "set") return !item.is_default;
    if (selectMode === "unset") return item.is_default;
    return false;
  };

  const toggleSelect = (item: Amenity) => {
    if (!isSelectable(item)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  };

  const selectAllSelectable = () => {
    setSelectedIds(new Set(selectableFiltered.map((item) => item.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const confirmAndSave = async () => {
    if (!selectMode || selectedIds.size === 0) return;
    setBulkSaving(true);
    setError(null);
    try {
      const updated = await setAmenitiesDefault(
        Array.from(selectedIds),
        selectMode === "set",
      );
      const byId = new Map(updated.map((row) => [row.id, row]));
      setItems((prev) => prev.map((item) => byId.get(item.id) ?? item));
      exitSelectMode();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update defaults. Run 012_amenities_is_default.sql in Supabase.",
      );
      setConfirmOpen(false);
    } finally {
      setBulkSaving(false);
    }
  };

  const handleAdd = async (data: {
    title: string;
    status: AmenityStatus;
    is_default: boolean;
    icon_url?: string | null;
    cloudinary_public_id?: string | null;
  }) => {
    const created = await createAmenity({
      title: data.title,
      status: data.status,
      is_default: data.is_default,
      icon_url: data.icon_url,
      cloudinary_public_id: data.cloudinary_public_id,
    });
    setItems((prev) => [...prev, created]);
  };

  const handleEdit = async (data: {
    title: string;
    status: AmenityStatus;
    is_default: boolean;
    icon_url?: string | null;
    cloudinary_public_id?: string | null;
    clearIcon?: boolean;
  }) => {
    if (!editItem) return;
    const updated = await updateAmenity({
      id: editItem.id,
      title: data.title,
      status: data.status,
      is_default: data.is_default,
      icon_url: data.icon_url,
      cloudinary_public_id: data.cloudinary_public_id,
      clearIcon: data.clearIcon,
    });
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setEditItem(null);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await deleteAmenity(deleteItem.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteItem.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteItem.id);
        return next;
      });
      setDeleteItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  const selectedTitles = items
    .filter((item) => selectedIds.has(item.id))
    .map((item) => item.title);

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="gap-4 border-b border-slate-100/80 bg-gradient-to-b from-slate-50/80 to-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                Amenities
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? "Loading amenities..."
                  : `${filtered.length} amenities · ${defaultCount} default`}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <div className="relative w-full sm:w-56 lg:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search amenities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 border-slate-200 bg-white pl-9 shadow-none"
                  disabled={!!selectMode}
                />
              </div>

              {!selectMode ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full cursor-pointer border-slate-200 sm:w-auto"
                    onClick={() => startSelectMode("set")}
                    disabled={loading || nonDefaultCount === 0}
                  >
                    <Star className="h-4 w-4" />
                    Set as Default
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full cursor-pointer border-slate-200 sm:w-auto"
                    onClick={() => startSelectMode("unset")}
                    disabled={loading || defaultCount === 0}
                  >
                    <StarOff className="h-4 w-4" />
                    Unset Default
                  </Button>
                  <Button
                    className="h-10 w-full shrink-0 cursor-pointer sm:w-auto"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add Amenity
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full cursor-pointer sm:w-auto"
                  onClick={exitSelectMode}
                  disabled={bulkSaving}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {selectMode && (
            <div className="flex flex-col gap-3 rounded-2xl border border-[#16233f]/10 bg-[#16233f]/[0.03] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-[#16233f]">
                  {selectMode === "set"
                    ? "Select amenities to mark as default"
                    : "Select default amenities to remove"}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#16233f] shadow-sm ring-1 ring-slate-200">
                    <Check className="h-3.5 w-3.5" />
                    {selectedCount} selected
                  </span>
                  <button
                    type="button"
                    className="cursor-pointer text-xs font-semibold text-[#16233f] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={
                      allSelectableSelected
                        ? clearSelection
                        : selectAllSelectable
                    }
                    disabled={bulkSaving || selectableFiltered.length === 0}
                  >
                    {allSelectableSelected ? "Clear all" : "Select all"}
                  </button>
                  <span className="text-xs text-slate-400">
                    {selectMode === "set"
                      ? "Showing only amenities that are not default yet"
                      : "Showing only amenities currently marked default"}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                className="h-9 w-full cursor-pointer sm:w-auto"
                disabled={bulkSaving || selectedCount === 0}
                onClick={() => setConfirmOpen(true)}
              >
                Save Changes
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-3 sm:p-5">
          {error && (
            <AlertBanner variant="warning" className="mb-4">
              {error}
              <button
                type="button"
                className="ml-2 cursor-pointer font-semibold underline"
                onClick={() => void loadItems()}
              >
                Retry
              </button>
            </AlertBanner>
          )}

          {loading ? (
            <CardGridSkeleton items={12} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No amenities yet"
              description="Add premium amenities with clear icons for your listings."
              action={
                <Button className="cursor-pointer" onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add Amenity
                </Button>
              }
            />
          ) : selectMode && selectableFiltered.length === 0 ? (
            <EmptyState
              title={
                selectMode === "set"
                  ? "No amenities left to set as default"
                  : "No default amenities to unset"
              }
              description={
                selectMode === "set"
                  ? "Everything matching your search is already marked default."
                  : "Nothing matching your search is currently marked default."
              }
              action={
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={exitSelectMode}
                >
                  Done
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {(selectMode ? selectableFiltered : filtered).map(
                (item, index) => {
                  const selected = selectedIds.has(item.id);

                  return (
                    <motion.article
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.015, 0.3) }}
                      onClick={() => {
                        if (selectMode) toggleSelect(item);
                      }}
                      className={cn(
                        "amenity-cube group relative flex aspect-square flex-col items-center justify-center rounded-2xl px-2.5 pb-3 pt-4 text-center transition-all duration-200 hover:-translate-y-0.5",
                        selectMode && "cursor-pointer",
                        selected &&
                          "ring-2 ring-[#16233f] ring-offset-2 ring-offset-white",
                      )}
                    >
                      {selectMode ? (
                        <button
                          type="button"
                          aria-label={
                            selected
                              ? `Unselect ${item.title}`
                              : `Select ${item.title}`
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(item);
                          }}
                          className={cn(
                            "absolute left-2 top-2 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border transition-colors",
                            selected
                              ? "border-[#16233f] bg-[#16233f] text-white"
                              : "border-slate-300 bg-white text-transparent hover:border-[#16233f]/50",
                          )}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <div className="absolute right-1 top-1 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                          <ActionsDropdown
                            onEdit={() => setEditItem(item)}
                            onDelete={() => setDeleteItem(item)}
                          />
                        </div>
                      )}

                      <AmenityIcon
                        title={item.title}
                        iconUrl={item.icon_url}
                        iconKey={item.icon_key}
                        size="xl"
                      />

                      <h3 className="amenity-name mt-3 line-clamp-2 w-full px-1 text-[13px] sm:text-sm">
                        {item.title}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                        <Badge
                          variant={
                            item.status === "active"
                              ? "success"
                              : "destructive"
                          }
                          className="text-[10px]"
                        >
                          {item.status}
                        </Badge>
                        {item.is_default && !selectMode && (
                          <Badge variant="premium" className="gap-1 text-[10px]">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            Default
                          </Badge>
                        )}
                      </div>
                    </motion.article>
                  );
                },
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AmenityFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        mode="add"
        onSubmit={handleAdd}
      />

      <AmenityFormDialog
        open={!!editItem}
        onOpenChange={(open) => {
          if (!open) setEditItem(null);
        }}
        mode="edit"
        initial={editItem}
        onSubmit={handleEdit}
      />

      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Amenity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteItem?.title}&quot;?
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setDeleteItem(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={() => void handleDelete()}
              loading={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!bulkSaving) setConfirmOpen(open);
        }}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectMode === "set"
                ? "Confirm set as default"
                : "Confirm unset default"}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-sm text-slate-500">
                <p>
                  {selectMode === "set"
                    ? `Mark ${selectedCount} selected amenit${selectedCount === 1 ? "y" : "ies"} as default?`
                    : `Remove default from ${selectedCount} selected amenit${selectedCount === 1 ? "y" : "ies"}?`}
                </p>
                {selectedTitles.length > 0 && (
                  <ul className="max-h-40 list-disc space-y-1 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-slate-700">
                    {selectedTitles.map((title) => (
                      <li key={title}>{title}</li>
                    ))}
                  </ul>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setConfirmOpen(false)}
              disabled={bulkSaving}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer"
              onClick={() => void confirmAndSave()}
              loading={bulkSaving}
            >
              {bulkSaving ? "Saving..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
