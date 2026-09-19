"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Inbox, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActionsDropdown } from "@/components/ui/actions-dropdown";
import { AlertBanner } from "@/components/ui/alert-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { ScrollRegion } from "@/components/ui/scroll-region";
import { TestimonialFormDialog } from "@/components/customization/testimonial-form-dialog";
import type { TestimonialFormSubmitData } from "@/components/customization/testimonial-form-dialog";
import {
  createTestimonial,
  deleteTestimonial,
  listTestimonials,
  updateTestimonial,
} from "@/lib/testimonials-api";
import {
  getTestimonialInitials,
  type Testimonial,
  type TestimonialStatus,
} from "@/lib/testimonials";
import {
  notifyAdminListChanged,
  replaceById,
} from "@/lib/admin-list-sync";
import { useConfirmDelete } from "@/hooks/use-confirm-delete";
import { usePagedList } from "@/hooks/use-paged-list";
import { AdminPagination } from "@/components/ui/admin-pagination";

export function TestimonialsPageContent() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Testimonial | null>(null);
  const { requestDelete, dialog: confirmDeleteDialog } = useConfirmDelete();
  const editItemRef = useRef(editItem);
  editItemRef.current = editItem;

  const loadItems = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const rows = await listTestimonials();
      setItems(rows);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load testimonials.",
      );
      if (!silent) setItems([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.role.toLowerCase().includes(q) ||
        item.quote.toLowerCase().includes(q),
    );
  }, [items, search]);
  const pager = usePagedList(filtered, search);

  const handleAdd = async (data: TestimonialFormSubmitData) => {
    const created = await createTestimonial(data);
    setItems((prev) => [...prev, created]);
    notifyAdminListChanged();
  };

  const handleEdit = async (data: TestimonialFormSubmitData) => {
    const current = editItemRef.current;
    if (!current) return;
    const updated = await updateTestimonial({
      id: current.id,
      ...data,
      sort_order: current.sort_order,
    });
    setItems((prev) =>
      replaceById(prev, current.id, { ...current, ...updated, id: current.id }),
    );
    setEditItem(null);
    notifyAdminListChanged();
  };

  const handleSetStatus = async (item: Testimonial, status: TestimonialStatus) => {
    if (item.status === status) return;
    setError(null);
    try {
      const updated = await updateTestimonial({
        id: item.id,
        name: item.name,
        role: item.role,
        quote: item.quote,
        status,
        sort_order: item.sort_order,
      });
      setItems((prev) =>
        replaceById(prev, item.id, { ...item, ...updated, id: item.id, status }),
      );
      notifyAdminListChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update status.",
      );
    }
  };

  const itemActions = (item: Testimonial) => (
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
      onDelete={() =>
        requestDelete({
          title: "Delete testimonial?",
          description: `Are you sure you want to delete “${item.name}”? This cannot be undone.`,
          onConfirm: async () => {
            try {
              await deleteTestimonial(item.id);
              setItems((prev) => prev.filter((i) => i.id !== item.id));
              notifyAdminListChanged();
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Failed to delete.",
              );
              throw err;
            }
          },
        })
      }
    />
  );

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="gap-4 border-b border-slate-100/80 bg-gradient-to-b from-slate-50/80 to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              Testimonials
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading testimonials..."
                : `${filtered.length} ${filtered.length === 1 ? "quote" : "quotes"} on the homepage`}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search testimonials..."
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
              Add Testimonial
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

          <div className="space-y-2.5 p-3 md:hidden">
            {loading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-[88px] rounded-xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No testimonials"
                description="Add client quotes to show on the homepage."
                action={
                  <Button className="cursor-pointer" onClick={() => setAddOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add Testimonial
                  </Button>
                }
              />
            ) : (
              pager.pageItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3.5 py-3 shadow-sm"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <InitialsBadge name={item.name} />
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-medium text-slate-900">
                        {item.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">{item.role}</p>
                      <p className="line-clamp-2 text-[13px] leading-snug text-slate-600">
                        {item.quote}
                      </p>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                  {itemActions(item)}
                </motion.div>
              ))
            )}
          </div>

          <ScrollRegion fade className="hidden md:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="px-4 py-3.5 font-semibold lg:px-6">Client</th>
                  <th className="px-4 py-3.5 font-semibold lg:px-6">Quote</th>
                  <th className="px-4 py-3.5 font-semibold lg:px-6">Status</th>
                  <th className="w-14 px-3 py-3.5 lg:px-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-0">
                      <TableSkeleton rows={6} columns={4} />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 lg:px-6">
                      <EmptyState
                        icon={Inbox}
                        title="No testimonials"
                        description="Add client quotes to show on the homepage."
                        action={
                          <Button
                            className="cursor-pointer"
                            onClick={() => setAddOpen(true)}
                          >
                            <Plus className="h-4 w-4" />
                            Add Testimonial
                          </Button>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  pager.pageItems.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4 lg:px-6">
                        <div className="flex items-center gap-3">
                          <InitialsBadge name={item.name} />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900">{item.name}</p>
                            <p className="truncate text-xs text-slate-500">
                              {item.role}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-md px-4 py-4 text-slate-600 lg:px-6">
                        <p className="line-clamp-2 leading-relaxed">{item.quote}</p>
                      </td>
                      <td className="px-4 py-4 lg:px-6">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-3 py-4 text-right lg:px-4">
                        {itemActions(item)}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </ScrollRegion>
          <AdminPagination
            page={pager.page}
            totalPages={pager.totalPages}
            from={pager.from}
            to={pager.to}
            total={pager.total}
            onPageChange={pager.setPage}
          />
        </CardContent>
      </Card>

      <TestimonialFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        mode="add"
        onSubmit={handleAdd}
      />

      <TestimonialFormDialog
        open={!!editItem}
        onOpenChange={(open) => {
          if (!open) setEditItem(null);
        }}
        mode="edit"
        initial={editItem}
        onSubmit={handleEdit}
      />

      {confirmDeleteDialog}
    </>
  );
}

function InitialsBadge({ name }: { name: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#16233f] text-[11px] font-semibold tracking-wide text-white">
      {getTestimonialInitials(name)}
    </span>
  );
}
