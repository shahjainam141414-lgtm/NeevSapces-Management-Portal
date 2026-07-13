"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Inbox, Plus, Search } from "lucide-react";
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
import { EntityFormDialog } from "@/components/customization/entity-form-dialog";
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

type CustomizationPageContentProps = {
  title: string;
  entityLabel: string;
  optionType: StaticOptionType;
};

function StatusBadge({ status }: { status: OptionStatus }) {
  return (
    <Badge variant={status === "active" ? "success" : "destructive"}>
      {status}
    </Badge>
  );
}

export function CustomizationPageContent({
  title,
  entityLabel,
  optionType,
}: CustomizationPageContentProps) {
  const [items, setItems] = useState<EntityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<EntityItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<EntityItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listStaticOptions(optionType);
      setItems(rows);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load data from Supabase";
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [optionType]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = async (data: { value: string; status: OptionStatus }) => {
    const created = await createStaticOption({
      type: optionType,
      value: data.value,
      status: data.status,
    });
    setItems((prev) =>
      [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
    );
  };

  const handleEdit = async (data: { value: string; status: OptionStatus }) => {
    if (!editItem) return;
    const updated = await updateStaticOption({
      id: editItem.id,
      value: data.value,
      status: data.status,
    });
    setItems((prev) =>
      prev
        .map((i) => (i.id === updated.id ? updated : i))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
    setEditItem(null);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await deleteStaticOption(deleteItem.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete. Try again.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden border-slate-200/70 bg-white/90 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
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
            <div className="border-b border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:px-6">
              {error}
              <button
                type="button"
                className="ml-2 cursor-pointer font-semibold underline underline-offset-2"
                onClick={() => void loadItems()}
              >
                Retry
              </button>
            </div>
          )}

          {/* Mobile cards */}
          <div className="space-y-2.5 p-3 sm:hidden">
            {loading ? (
              <p className="py-10 text-center text-sm text-slate-500">
                Loading {title.toLowerCase()}...
              </p>
            ) : filtered.length === 0 ? (
              <EmptyState
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
                  <div className="min-w-0 space-y-1.5">
                    <p className="truncate font-medium text-slate-900">
                      {item.name}
                    </p>
                    <StatusBadge status={item.status} />
                  </div>
                  <ActionsDropdown
                    onEdit={() => setEditItem(item)}
                    onDelete={() => setDeleteItem(item)}
                  />
                </motion.div>
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="px-6 py-3.5 font-semibold">Name</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="w-14 px-4 py-3.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-14 text-center text-slate-500"
                    >
                      Loading {title.toLowerCase()}...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-6">
                      <EmptyState
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
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <ActionsDropdown
                          onEdit={() => setEditItem(item)}
                          onDelete={() => setDeleteItem(item)}
                        />
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <EntityFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        entityLabel={entityLabel}
        mode="add"
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
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EmptyState({
  title,
  entityLabel,
  onAdd,
}: {
  title: string;
  entityLabel: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Inbox className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-slate-800">
        No {title.toLowerCase()} yet
      </p>
      <p className="mt-1 max-w-xs text-sm text-slate-500">
        Add your first {entityLabel.toLowerCase()} to start building listings.
      </p>
      <Button className="mt-4 cursor-pointer" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        Add {entityLabel}
      </Button>
    </div>
  );
}
