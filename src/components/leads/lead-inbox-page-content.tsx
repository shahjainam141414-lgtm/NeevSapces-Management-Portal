"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  MoreHorizontal,
  Phone,
  Search,
  StickyNote,
  Unlock,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addEnquiryNote,
  listBrowseUnlocks,
  listContactEnquiries,
  listSavedHomeLeads,
  updateEnquiryStatus,
  type BrowseUnlockRow,
  type ContactEnquiryRow,
  type SavedHomeLead,
} from "@/app/actions/leads";
import {
  ENQUIRY_STATUSES,
  enquiryStatusLabel,
  type EnquiryStatus,
} from "@/lib/enquiry-status";
import { cn } from "@/lib/utils";

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function truncateMessage(text: string, max = 50) {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

const PAGE_SIZES = [10, 20, 50, 100] as const;
type PageSize = (typeof PAGE_SIZES)[number];

function useClientPager<T>(items: T[], pageSize: PageSize, resetKey: string) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const slice = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return {
    page: safePage,
    setPage,
    totalPages,
    slice,
    total,
    from: total === 0 ? 0 : (safePage - 1) * pageSize + 1,
    to: Math.min(safePage * pageSize, total),
  };
}

function ListPager({
  page,
  totalPages,
  total,
  from,
  to,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
  pageSize: PageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
      <p className="text-sm text-slate-500">
        {total === 0 ? "0 results" : `Showing ${from}–${to} of ${total}`}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Rows</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v) as PageSize)}
          >
            <SelectTrigger className="h-9 w-[88px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[72px] text-center text-sm tabular-nums text-slate-600">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function statusTone(status: string) {
  switch (status) {
    case "new":
      return "bg-sky-50 text-sky-800 ring-sky-200";
    case "connected":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "recall":
    case "recall_done":
      return "bg-rose-50 text-rose-800 ring-rose-200";
    case "not_reachable":
      return "bg-orange-50 text-orange-800 ring-orange-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

function rowTone(status: string) {
  if (status === "connected") return "bg-emerald-50/70";
  if (status === "recall" || status === "recall_done") return "bg-rose-50/70";
  return undefined;
}

export function LeadInboxPageContent() {
  const [tab, setTab] = useState("contact");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enquiries, setEnquiries] = useState<ContactEnquiryRow[]>([]);
  const [saved, setSaved] = useState<SavedHomeLead[]>([]);
  const [unlocks, setUnlocks] = useState<BrowseUnlockRow[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [noteTarget, setNoteTarget] = useState<ContactEnquiryRow | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [detailTarget, setDetailTarget] = useState<ContactEnquiryRow | null>(
    null,
  );
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [statusFilter, setStatusFilter] = useState<"all" | EnquiryStatus>(
    "all",
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [a, b, c] = await Promise.all([
      listContactEnquiries(),
      listSavedHomeLeads(),
      listBrowseUnlocks(),
    ]);

    const errors: string[] = [];
    if (a.ok) setEnquiries(a.rows);
    else errors.push(a.error);
    if (b.ok) setSaved(b.rows);
    else errors.push(b.error);
    if (c.ok) setUnlocks(c.rows);
    else errors.push(c.error);

    setError(errors[0] ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const q = search.trim().toLowerCase();

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: enquiries.length };
    for (const s of ENQUIRY_STATUSES) counts[s.value] = 0;
    for (const r of enquiries) {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
    }
    return counts;
  }, [enquiries]);

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q) ||
        r.message.toLowerCase().includes(q) ||
        r.notes.some((n) => n.note.toLowerCase().includes(q))
      );
    });
  }, [enquiries, q, statusFilter]);

  const filteredSaved = useMemo(() => {
    if (!q) return saved;
    return saved.filter(
      (r) =>
        r.phone.toLowerCase().includes(q) ||
        (r.name ?? "").toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q),
    );
  }, [saved, q]);

  const filteredUnlocks = useMemo(() => {
    if (!q) return unlocks;
    return unlocks.filter(
      (r) =>
        r.phone.toLowerCase().includes(q) ||
        (r.name ?? "").toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q) ||
        r.viewed_slugs.some((s) => s.toLowerCase().includes(q)),
    );
  }, [unlocks, q]);

  const contactPager = useClientPager(
    filteredEnquiries,
    pageSize,
    `contact:${q}:${statusFilter}`,
  );
  const savedPager = useClientPager(filteredSaved, pageSize, `saved:${q}`);
  const unlocksPager = useClientPager(
    filteredUnlocks,
    pageSize,
    `unlocks:${q}`,
  );

  async function markStatus(id: string, status: EnquiryStatus) {
    const current = enquiries.find((r) => r.id === id)?.status;
    if (current === status) return;

    setUpdatingId(id);
    setError(null);
    try {
      const res = await updateEnquiryStatus(id, status);
      if (res.ok) {
        setEnquiries((prev) =>
          prev.map((row) => (row.id === id ? { ...row, status } : row)),
        );
      } else {
        setError(res.error);
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function saveNote() {
    if (!noteTarget) return;
    setSavingNote(true);
    const res = await addEnquiryNote(noteTarget.id, noteText);
    if (res.ok) {
      setEnquiries((prev) =>
        prev.map((row) =>
          row.id === noteTarget.id
            ? { ...row, notes: [...row.notes, res.note] }
            : row,
        ),
      );
      setNoteText("");
      setNoteTarget(null);
    } else {
      setError(res.error);
    }
    setSavingNote(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Visitor signals"
        title="Lead inbox"
        description="Contact enquiries, saved homes, and visitors who unlocked more listings."
      />

      {error ? <AlertBanner variant="error">{error}</AlertBanner> : null}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, email, note, or property…"
          className="pl-9"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 sm:grid-cols-3">
          <TabsTrigger value="contact" className="gap-2">
            <Mail className="size-3.5" />
            Contact desk
            <Badge variant="secondary" className="ml-1">
              {enquiries.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2">
            <Bookmark className="size-3.5" />
            Saved homes
            <Badge variant="secondary" className="ml-1">
              {saved.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="unlocks" className="gap-2">
            <Unlock className="size-3.5" />
            Browse unlocks
            <Badge variant="secondary" className="ml-1">
              {unlocks.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contact" className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Website Contact enquiries — update status and add follow-up notes.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Status</span>
              <Select
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(v as "all" | EnquiryStatus)
                }
              >
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All statuses ({statusCounts.all ?? 0})
                  </SelectItem>
                  {ENQUIRY_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label} ({statusCounts[s.value] ?? 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {loading ? (
            <LoadingCards />
          ) : filteredEnquiries.length === 0 ? (
            <EmptyState
              title={
                statusFilter !== "all" || q
                  ? "No matching enquiries"
                  : "No contact enquiries yet"
              }
              description={
                statusFilter !== "all" || q
                  ? "Try a different status filter or search."
                  : "When someone sends an enquiry on the website, it will appear here."
              }
            />
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white">
                <div className="min-w-[920px]">
                  <div className="grid grid-cols-[1.1fr_1fr_1.2fr_1.4fr_1fr_110px_72px] gap-3 border-b border-slate-100 bg-[#eef1f6]/60 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <span>Name</span>
                    <span>Phone</span>
                    <span>Email</span>
                    <span>Message</span>
                    <span>Received</span>
                    <span>Status</span>
                    <span className="text-right">Actions</span>
                  </div>
                  <ul>
                    {contactPager.slice.map((row) => (
                      <li
                        key={row.id}
                        className={cn("px-4 py-3.5", rowTone(row.status))}
                      >
                        <div className="grid grid-cols-[1.1fr_1fr_1.2fr_1.4fr_1fr_110px_72px] items-start gap-3">
                          <p className="truncate font-semibold text-[#16233f]">
                            {row.name}
                          </p>
                          <a
                            href={`tel:${row.phone}`}
                            className="truncate text-sm text-slate-600 hover:text-[#16233f]"
                            title={row.phone}
                          >
                            {row.phone}
                          </a>
                          {row.email ? (
                            <a
                              href={`mailto:${row.email}`}
                              className="truncate text-sm text-slate-600 hover:text-[#16233f]"
                              title={row.email}
                            >
                              {row.email}
                            </a>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                          <p
                            className="truncate text-sm text-slate-700"
                            title={row.message}
                          >
                            {truncateMessage(row.message, 50)}
                          </p>
                          <p className="text-sm tabular-nums text-slate-500">
                            {formatWhen(row.created_at)}
                          </p>
                          <div>
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ring-1",
                                statusTone(row.status),
                              )}
                            >
                              {enquiryStatusLabel(row.status)}
                            </span>
                          </div>
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label="Enquiry actions"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem
                                  onSelect={() => setDetailTarget(row)}
                                >
                                  <Eye className="mr-2 h-3.5 w-3.5" />
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setNoteTarget(row);
                                    setNoteText("");
                                  }}
                                >
                                  <StickyNote className="mr-2 h-3.5 w-3.5" />
                                  Add note
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                  Set status
                                </p>
                                {ENQUIRY_STATUSES.map((s) => {
                                  const isCurrent = row.status === s.value;
                                  return (
                                    <DropdownMenuItem
                                      key={s.value}
                                      disabled={
                                        isCurrent || updatingId === row.id
                                      }
                                      onSelect={() => {
                                        if (isCurrent || updatingId === row.id)
                                          return;
                                        void markStatus(row.id, s.value);
                                      }}
                                    >
                                      <span className="mr-2 flex h-3.5 w-3.5 items-center justify-center">
                                        {isCurrent ? (
                                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                                        ) : null}
                                      </span>
                                      {s.label}
                                    </DropdownMenuItem>
                                  );
                                })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {row.notes.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                              Notes
                            </p>
                            {row.notes.map((n) => (
                              <div
                                key={n.id}
                                className="rounded-lg border border-slate-100 bg-white/70 px-3 py-2"
                              >
                                <p className="text-sm leading-relaxed text-slate-700">
                                  {n.note}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-400">
                                  {n.created_by_name || "Admin"} ·{" "}
                                  {formatWhen(n.created_at)}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <ListPager
                page={contactPager.page}
                totalPages={contactPager.totalPages}
                total={contactPager.total}
                from={contactPager.from}
                to={contactPager.to}
                pageSize={pageSize}
                onPageChange={contactPager.setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-5 space-y-3">
          <p className="text-sm text-slate-500">
            Homes visitors liked after signing in with their mobile number.
          </p>
          {loading ? (
            <LoadingCards />
          ) : filteredSaved.length === 0 ? (
            <EmptyState
              title={q ? "No matching saved homes" : "No saved homes yet"}
              description={
                q
                  ? "Try a different search."
                  : "When buyers heart a property on the site, their shortlist shows up here."
              }
            />
          ) : (
            <div className="space-y-3">
              {savedPager.slice.map((row) => (
                <Card key={`${row.phone}-${row.slug}-${row.liked_at}`}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#16233f]">
                        {row.name || "Visitor"}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="size-3.5" />
                          {row.phone}
                        </span>
                        {row.email ? <span>{row.email}</span> : null}
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        Liked {formatWhen(row.liked_at)}
                        {row.last_login_at
                          ? ` · Last login ${formatWhen(row.last_login_at)}`
                          : ""}
                      </p>
                    </div>
                    <Link
                      href={`/customization/properties`}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#16233f] transition hover:bg-[#eef1f6]"
                      title={row.slug}
                    >
                      {row.slug}
                    </Link>
                  </CardContent>
                </Card>
              ))}
              <ListPager
                page={savedPager.page}
                totalPages={savedPager.totalPages}
                total={savedPager.total}
                from={savedPager.from}
                to={savedPager.to}
                pageSize={pageSize}
                onPageChange={savedPager.setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="unlocks" className="mt-5 space-y-3">
          <p className="text-sm text-slate-500">
            Visitors who used their free views, then verified a number to keep
            exploring — strong buying intent.
          </p>
          {loading ? (
            <LoadingCards />
          ) : filteredUnlocks.length === 0 ? (
            <EmptyState
              title={q ? "No matching unlocks" : "No browse unlocks yet"}
              description={
                q
                  ? "Try a different search."
                  : "When someone hits the free-view limit and signs in to see more, they land here."
              }
            />
          ) : (
            <div className="space-y-3">
              {unlocksPager.slice.map((row) => (
                <Card key={row.id}>
                  <CardContent className="space-y-3 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#16233f]">
                          {row.name || "Visitor"}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="size-3.5" />
                            {row.phone}
                          </span>
                          {row.email ? <span>{row.email}</span> : null}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">
                        {formatWhen(row.created_at)}
                      </p>
                    </div>
                    {row.viewed_slugs.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {row.viewed_slugs.map((slug) => (
                          <span
                            key={slug}
                            className="rounded-md bg-[#eef1f6] px-2 py-1 text-xs font-medium text-[#16233f]"
                          >
                            {slug}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
              <ListPager
                page={unlocksPager.page}
                totalPages={unlocksPager.totalPages}
                total={unlocksPager.total}
                from={unlocksPager.from}
                to={unlocksPager.to}
                pageSize={pageSize}
                onPageChange={unlocksPager.setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={Boolean(detailTarget)}
        onOpenChange={(open) => {
          if (!open) setDetailTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Enquiry details</DialogTitle>
            <DialogDescription>
              Full enquiry submitted from the website Contact page.
            </DialogDescription>
          </DialogHeader>
          {detailTarget ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Name
                  </p>
                  <p className="mt-1 font-semibold text-[#16233f]">
                    {detailTarget.name}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Received
                  </p>
                  <p className="mt-1 text-slate-700">
                    {formatWhen(detailTarget.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Phone
                  </p>
                  <a
                    href={`tel:${detailTarget.phone}`}
                    className="mt-1 inline-block text-slate-700 hover:text-[#16233f]"
                  >
                    {detailTarget.phone}
                  </a>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Email
                  </p>
                  {detailTarget.email ? (
                    <a
                      href={`mailto:${detailTarget.email}`}
                      className="mt-1 inline-block break-all text-slate-700 hover:text-[#16233f]"
                    >
                      {detailTarget.email}
                    </a>
                  ) : (
                    <p className="mt-1 text-slate-400">—</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Status
                  </p>
                  <p className="mt-1">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
                        statusTone(detailTarget.status),
                      )}
                    >
                      {enquiryStatusLabel(detailTarget.status)}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Full message
                </p>
                <p className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-200 bg-[#eef1f6]/50 px-3.5 py-3 leading-relaxed text-slate-700">
                  {detailTarget.message}
                </p>
              </div>
              {detailTarget.notes.length > 0 ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Notes
                  </p>
                  <div className="mt-2 space-y-2">
                    {detailTarget.notes.map((n) => (
                      <div
                        key={n.id}
                        className="rounded-lg border border-slate-100 bg-white px-3 py-2"
                      >
                        <p className="text-slate-700">{n.note}</p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {n.created_by_name || "Admin"} ·{" "}
                          {formatWhen(n.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDetailTarget(null)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setNoteTarget(detailTarget);
                    setNoteText("");
                    setDetailTarget(null);
                  }}
                >
                  Add note
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(noteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setNoteTarget(null);
            setNoteText("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add note</DialogTitle>
            <DialogDescription>
              Save a follow-up note on this enquiry. It will show under the row
              in Contact desk.
            </DialogDescription>
          </DialogHeader>

          {noteTarget ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-[#eef1f6]/50 p-3.5 text-sm">
                <p className="font-semibold text-[#16233f]">{noteTarget.name}</p>
                <p className="mt-1 text-slate-600">{noteTarget.phone}</p>
                {noteTarget.email ? (
                  <p className="text-slate-600">{noteTarget.email}</p>
                ) : null}
                <p className="mt-2 line-clamp-4 text-slate-700">
                  {noteTarget.message}
                </p>
                <p className="mt-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                      statusTone(noteTarget.status),
                    )}
                  >
                    {enquiryStatusLabel(noteTarget.status)}
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Note
                </label>
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                  placeholder="e.g. Called — asked to recall tomorrow after 5 PM…"
                  autoFocus
                />
              </div>
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNoteTarget(null);
                setNoteText("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={savingNote || noteText.trim().length < 2}
              onClick={() => void saveNote()}
            >
              {savingNote ? "Saving…" : "Save note"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}
