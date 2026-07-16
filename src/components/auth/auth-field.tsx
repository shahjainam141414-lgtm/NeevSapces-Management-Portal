import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type AuthFieldProps = {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  icon: LucideIcon;
  error?: string;
  rightElement?: React.ReactNode;
  registration?: React.ComponentProps<"input">;
};

export function AuthField({
  id,
  label,
  type = "text",
  placeholder,
  icon: Icon,
  error,
  rightElement,
  registration,
}: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600"
        >
          {label}
        </label>
        {rightElement}
      </div>
      <div className="auth-input-glass relative flex items-center gap-2.5 rounded-xl px-3.5 py-1">
        <Icon className="h-4 w-4 shrink-0 text-slate-500" />
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          className={cn(
            "w-full bg-transparent py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400",
          )}
          {...registration}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
