import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#1a2744] text-white",
        secondary: "border-transparent bg-slate-100 text-slate-600",
        success:
          "border-emerald-100 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100/80",
        warning:
          "border-amber-100 bg-amber-50 text-amber-700 ring-1 ring-amber-100/80",
        destructive:
          "border-red-100 bg-red-50 text-red-600 ring-1 ring-red-100/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, children, ...props }: BadgeProps) {
  const showDot = variant === "success" || variant === "destructive";

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {showDot && (
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            variant === "success" ? "bg-emerald-500" : "bg-red-500",
          )}
          aria-hidden
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
