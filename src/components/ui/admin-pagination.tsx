"use client";

import { Button } from "@/components/ui/button";
import { ADMIN_PAGE_SIZE } from "@/hooks/use-paged-list";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function AdminPagination({
  page,
  totalPages,
  from,
  to,
  total,
  onPageChange,
  className,
}: Props) {
  if (total <= ADMIN_PAGE_SIZE) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-slate-100 px-3 py-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between min-[380px]:px-5",
        className,
      )}
    >
      <p className="text-xs text-slate-500">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </Button>
        <span className="min-w-[4.5rem] text-center text-xs font-medium tabular-nums text-slate-600">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
