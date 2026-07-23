import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#16233f] text-white",
        secondary: "border-slate-200/80 bg-slate-50 text-slate-600",
        premium: "badge-premium",
        success:
          "border-emerald-200/70 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100/60",
        warning:
          "border-amber-200/70 bg-amber-50 text-amber-800 ring-1 ring-amber-100/60",
        destructive:
          "border-red-200/70 bg-red-50 text-red-700 ring-1 ring-red-100/60",
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
  const showDot =
    variant === "success" ||
    variant === "destructive" ||
    variant === "warning";

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {showDot && (
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            variant === "success" && "bg-emerald-500",
            variant === "destructive" && "bg-red-500",
            variant === "warning" && "bg-amber-500",
          )}
          aria-hidden
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
