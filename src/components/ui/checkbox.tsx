"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> & {
  size?: "default" | "lg";
};

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, size = "default", ...props }, ref) => {
    const box = size === "lg" ? "h-7 w-7 rounded-lg" : "h-5 w-5 rounded-md";
    const icon = size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";

    return (
      <span
        className={cn(
          "group relative inline-flex shrink-0 cursor-pointer items-center justify-center",
          box,
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
          {...props}
        />
        <span
          className={cn(
            "pointer-events-none flex items-center justify-center border border-slate-300 bg-white text-white shadow-sm transition-all duration-150 peer-checked:border-[#16233f] peer-checked:bg-[#16233f] peer-focus-visible:ring-4 peer-focus-visible:ring-[#16233f]/15 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-hover:border-slate-400 peer-checked:group-hover:border-[#1f3157] peer-checked:[&_svg]:scale-100 peer-checked:[&_svg]:opacity-100",
            box,
            className,
          )}
        >
          <Check
            className={cn(
              "scale-0 opacity-0 transition-all duration-150",
              icon,
            )}
            strokeWidth={3}
            aria-hidden
          />
        </span>
      </span>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
