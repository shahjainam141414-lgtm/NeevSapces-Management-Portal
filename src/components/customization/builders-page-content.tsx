"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Inbox, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
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
import { BuilderFormDialog } from "@/components/customization/builder-form-dialog";
import { BuilderLogo } from "@/components/customization/builder-logo";
import {
  createBuilder,
  deleteBuilder,
  listBuilders,
  updateBuilder,
} from "@/lib/builders-api";
import type { Builder, BuilderStatus } from "@/lib/builders";

export function BuildersPageContent() {
  const [items, setItems] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Builder | null>(null);
  const [deleteItem, setDeleteItem] = useState<Builder | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listBuilders();
      setItems(rows);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load builders. Run 006_builders.sql in Supabase.",
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items
      .filter((item) => !q || item.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, search]);

  const handleAdd = async (data: {
    name: string;
    status: BuilderStatus;
    logo_url?: string | null;
    cloudinary_public_id?: string | null;
  }) => {
    const created = await createBuilder({
      name: data.name,
      tier: 1,
      status: data.status,
      website: null,
      logo_url: data.logo_url,
      cloudinary_public_id: data.cloudinary_public_id,
    });
    setItems((prev) => [...prev, created]);
  };

  const handleEdit = async (data: {
    name: string;
    status: BuilderStatus;
    logo_url?: string | null;
    cloudinary_public_id?: string | null;
    clearLogo?: boolean;
  }) => {
    if (!editItem) return;
    const updated = await updateBuilder({
      id: editItem.id,
      name: data.name,
      tier: editItem.tier,
      status: data.status,
      website: editItem.website,
      logo_url: data.logo_url,
      cloudinary_public_id: data.cloudinary_public_id,
      clearLogo: data.clearLogo,
    });
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setEditItem(null);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await deleteBuilder(deleteItem.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSetStatus = async (item: Builder, status: BuilderStatus) => {
    if (item.status === status) return;
    setError(null);
    try {
      const updated = await updateBuilder({
        id: item.id,
        name: item.name,
        tier: item.tier,
        status,
        website: item.website,
      });
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update status.",
      );
    }
  };

  const builderActions = (item: Builder) => (
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
              Builders
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              {loading ? "Loading builders..." : `${filtered.length} builders`}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search builders..."
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
              Add Builder
            </Button>
          </div>
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
            <CardGridSkeleton items={10} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No builders found"
              description="Add builders with clear logos for your listings."
              action={
                <Button className="cursor-pointer" onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add Builder
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filtered.map((item, index) => (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.015, 0.3) }}
                  className="builder-cube group relative flex flex-col items-center rounded-2xl px-3 pb-4 pt-5 text-center transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="absolute right-1 top-1 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    {builderActions(item)}
                  </div>

                  <BuilderLogo name={item.name} logoUrl={item.logo_url} />

                  <h4 className="amenity-name mt-3.5 line-clamp-2 min-h-[2.4rem] w-full px-1 text-[13px] leading-snug sm:text-sm">
                    {item.name}
                  </h4>

                  <div className="mt-2.5">
                    <StatusBadge
                      status={item.status}
                      className="text-[10px]"
                    />
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BuilderFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        mode="add"
        onSubmit={handleAdd}
      />

      <BuilderFormDialog
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
            <DialogTitle>Delete Builder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteItem?.name}&quot;?
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
    </>
  );
}
