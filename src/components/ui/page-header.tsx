import * as React from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  eyebrow?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  actions,
  className,
  eyebrow,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 min-[380px]:gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3d5a9e] min-[380px]:text-[11px]">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-lg font-semibold tracking-tight text-slate-900 min-[380px]:text-xl sm:text-[1.75rem]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-slate-500 min-[380px]:mt-1.5 min-[380px]:text-sm">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex w-full min-w-0 shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
