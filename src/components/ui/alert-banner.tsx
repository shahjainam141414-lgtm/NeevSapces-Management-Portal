import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertBannerVariant = "error" | "success" | "warning" | "info";

const variantStyles: Record<AlertBannerVariant, string> = {
  error: "border-red-200 bg-red-50 text-red-600",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-slate-200 bg-slate-50 text-slate-600",
};

const variantIcons: Record<AlertBannerVariant, React.ElementType> = {
  error: XCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

type AlertBannerProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: AlertBannerVariant;
  children: React.ReactNode;
};

export function AlertBanner({
  variant = "info",
  className,
  children,
  ...props
}: AlertBannerProps) {
  const Icon = variantIcons[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm leading-snug",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
