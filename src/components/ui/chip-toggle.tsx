import * as React from "react";
import { cn } from "@/lib/utils";

type ChipToggleProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  icon?: React.ElementType;
};

export const ChipToggle = React.forwardRef<HTMLButtonElement, ChipToggleProps>(
  ({ selected = false, icon: Icon, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={selected}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200 active:scale-[0.97]",
          selected
            ? "border-[#16233f] bg-[#16233f] text-white shadow-[0_4px_14px_rgba(22,35,63,0.25)]"
            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
          className,
        )}
        {...props}
      >
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        {children}
      </button>
    );
  },
);
ChipToggle.displayName = "ChipToggle";

type ChipGroupProps = {
  children: React.ReactNode;
  className?: string;
};

export function ChipGroup({ children, className }: ChipGroupProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>{children}</div>
  );
}
