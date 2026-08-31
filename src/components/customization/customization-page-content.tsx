"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Inbox, ImageIcon, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActionsDropdown } from "@/components/ui/actions-dropdown";
import { AlertBanner } from "@/components/ui/alert-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { ScrollRegion } from "@/components/ui/scroll-region";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EntityFormDialog } from "@/components/customization/entity-form-dialog";
import type { EntityFormSubmitData } from "@/components/customization/entity-form-dialog";
import {
  createStaticOption,
  deleteStaticOption,
  listStaticOptions,
  updateStaticOption,
} from "@/lib/static-options-api";
import type {
  EntityItem,
  OptionStatus,
  StaticOptionType,
} from "@/lib/static-options";
import {
  notifyAdminListChanged,
  replaceById,
} from "@/lib/admin-list-sync";

type CustomizationPageContentProps = {
  title: string;
  entityLabel: string;
  optionType: StaticOptionType;
};

export function CustomizationPageContent({
  title,
  entityLabel,
  optionType,
}: CustomizationPageContentProps) {
  const enableImage = optionType === "area";
  const [items, setItems] = useState<EntityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<EntityItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<EntityItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const editItemRef = useRef(editItem);
  editItemRef.current = editItem;

  const loadItems = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const rows = await listStaticOptions(optionType);
      setItems(rows);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load data from Supabase";
      setError(message);
      if (!silent) setItems([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [optionType]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadItems();
  }, [loadItems]);

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = async (data: EntityFormSubmitData) => {
    const created = await createStaticOption({
      type: optionType,
      value: data.value,
      status: data.status,
      image_url: data.image_url,
      cloudinary_public_id: data.cloudinary_public_id,
    });
    setItems((prev) =>
      [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
    );
    notifyAdminListChanged();
  };

  const handleEdit = async (data: EntityFormSubmitData) => {
    const current = editItemRef.current;
    if (!current) return;
    const updated = await updateStaticOption({
      id: current.id,
      value: data.value,
      status: data.status,
      image_url: data.image_url,
      cloudinary_public_id: data.cloudinary_public_id,
      clearImage: data.clearImage,
    });
    const next: EntityItem = {
      ...current,
      ...updated,
      id: current.id,
      name: data.value,
      status: data.status,
      image_url: data.clearImage
        ? null
        : (data.image_url ?? updated.image_url ?? current.image_url),
      cloudinary_public_id: data.clearImage
        ? null
        : (data.cloudinary_public_id ??
          updated.cloudinary_public_id ??
          current.cloudinary_public_id),
    };
    setItems((prev) =>
      replaceById(prev, current.id, next).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    );
    setEditItem(null);
    notifyAdminListChanged();
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await deleteStaticOption(deleteItem.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteItem.id));
      setDeleteItem(null);
      notifyAdminListChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete. Try again.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleSetStatus = async (item: EntityItem, status: OptionStatus) => {
    if (item.status === status) return;
    setError(null);
    try {
      const updated = await updateStaticOption({
        id: item.id,
        value: item.name,
        status,
      });
      setItems((prev) =>
        replaceById(prev, item.id, {
          ...item,
          ...updated,
          id: item.id,
          status,
          name: updated.name || item.name,
        }).sort((a, b) => a.name.localeCompare(b.name)),
      );
      notifyAdminListChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update status.",
      );
    }
  };

  const entityActions = (item: EntityItem) => (
    <ActionsDropdown
      onEdit={() => setEditItem(item)}
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

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="gap-4 border-b border-slate-100/80 bg-gradient-to-b from-slate-50/80 to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              {title}
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading..."
                : `${filtered.length} ${title.toLowerCase()} found`}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder={`Search ${title.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 border-slate-200 bg-white pl-9 shadow-none"
              />
            </div>
            <Button
              className="h-10 w-full shrink-0 cursor-pointer sm:w-auto"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add {entityLabel}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error && (
            <div className="px-4 pt-4 sm:px-6">
              <AlertBanner variant="warning">
                {error}
                <button
                  type="button"
                  className="ml-2 cursor-pointer font-semibold underline underline-offset-2"
                  onClick={() => void loadItems()}
                >
                  Retry
                </button>
              </AlertBanner>
            </div>
          )}

          {/* Mobile / tablet cards */}
          <div className="space-y-2.5 p-3 md:hidden">
            {loading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-[60px] rounded-xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <ListEmptyState
                title={title}
                entityLabel={entityLabel}
                onAdd={() => setAddOpen(true)}
              />
            ) : (
              filtered.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3.5 py-3 shadow-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {enableImage ? (
                      <AreaThumb name={item.name} imageUrl={item.image_url} />
                    ) : null}
                    <div className="min-w-0 space-y-1.5">
                      <p className="truncate font-medium text-slate-900">
                        {item.name}
                      </p>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                  {entityActions(item)}
                </motion.div>
              ))
            )}
          </div>

          {/* Desktop table */}
          <ScrollRegion fade className="hidden md:block">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="px-4 py-3.5 font-semibold lg:px-6">Name</th>
                  <th className="px-4 py-3.5 font-semibold lg:px-6">Status</th>
                  <th className="w-14 px-3 py-3.5 lg:px-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="p-0">
                      <TableSkeleton rows={6} columns={3} />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 lg:px-6">
                      <ListEmptyState
                        title={title}
                        entityLabel={entityLabel}
                        onAdd={() => setAddOpen(true)}
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4 font-medium text-slate-900 lg:px-6">
                        <div className="flex items-center gap-3">
                          {enableImage ? (
                            <AreaThumb
                              name={item.name}
                              imageUrl={item.image_url}
                            />
                          ) : null}
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 lg:px-6">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-3 py-4 text-right lg:px-4">
                        {entityActions(item)}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </ScrollRegion>
        </CardContent>
      </Card>

      <EntityFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        entityLabel={entityLabel}
        mode="add"
        enableImage={enableImage}
        onSubmit={handleAdd}
      />

      <EntityFormDialog
        open={!!editItem}
        onOpenChange={(open) => {
          if (!open) setEditItem(null);
        }}
        entityLabel={entityLabel}
        mode="edit"
        initial={editItem}
        enableImage={enableImage}
        onSubmit={handleEdit}
      />

      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {entityLabel}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteItem?.name}&quot;?
              This action cannot be undone.
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
    </>
  );
}

function AreaThumb({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string | null;
}) {
  return (
    <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={imageUrl}
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-300">
          <ImageIcon className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

function ListEmptyState({
  title,
  entityLabel,
  onAdd,
}: {
  title: string;
  entityLabel: string;
  onAdd: () => void;
}) {
  return (
    <EmptyState
      icon={Inbox}
      title={`No ${title.toLowerCase()} yet`}
      description={`Add your first ${entityLabel.toLowerCase()} to start building listings.`}
      action={
        <Button className="cursor-pointer" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Add {entityLabel}
        </Button>
      }
    />
  );
}
