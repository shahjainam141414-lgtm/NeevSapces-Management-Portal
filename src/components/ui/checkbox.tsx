"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
>;

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, ...props }, ref) => {
    return (
      <label className="group relative inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
          {...props}
        />
        <span
          className={cn(
            "pointer-events-none flex h-5 w-5 items-center justify-center rounded-md border border-slate-300 bg-white text-white shadow-sm transition-all duration-150 peer-checked:border-[#16233f] peer-checked:bg-[#16233f] peer-focus-visible:ring-4 peer-focus-visible:ring-[#16233f]/15 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-hover:border-slate-400 peer-checked:group-hover:border-[#1f3157]",
            className,
          )}
        >
          <Check className="h-3.5 w-3.5 scale-0 opacity-0 transition-all duration-150 peer-checked:scale-100 peer-checked:opacity-100" />
        </span>
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
