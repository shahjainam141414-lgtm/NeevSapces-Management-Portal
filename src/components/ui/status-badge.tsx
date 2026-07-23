"use client";

import { cn } from "@/lib/utils";
import { Badge, type BadgeProps } from "@/components/ui/badge";

export type EntityStatus = "active" | "inactive" | "draft";

const STATUS_META: Record<
  string,
  { label: string; variant: NonNullable<BadgeProps["variant"]> }
> = {
  active: { label: "Active", variant: "success" },
  draft: { label: "Draft", variant: "warning" },
  inactive: { label: "Inactive", variant: "destructive" },
};

type StatusBadgeProps = {
  status: string;
  className?: string;
};

/** Consistent status pill across Customization & property flows. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = (status || "").toLowerCase();
  const meta = STATUS_META[key] ?? {
    label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown",
    variant: "secondary" as const,
  };

  return (
    <Badge
      variant={meta.variant}
      className={cn("normal-case tracking-normal", className)}
    >
      {meta.label}
    </Badge>
  );
}
