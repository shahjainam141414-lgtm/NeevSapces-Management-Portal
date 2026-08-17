import * as React from "react";
import { cn } from "@/lib/utils";

type ScrollRegionProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Horizontal scroll for wide tables / tab strips */
  axis?: "x" | "y" | "both";
  /** Soft edge fade hint that content scrolls */
  fade?: boolean;
};

/**
 * Contained scroll area that works inside the dashboard shell.
 * Horizontal-only regions must NOT block Lenis vertical page scroll.
 */
export function ScrollRegion({
  axis = "x",
  fade = false,
  className,
  children,
  ...props
}: ScrollRegionProps) {
  const overflow =
    axis === "x"
      ? "overflow-x-auto overflow-y-hidden"
      : axis === "y"
        ? "overflow-y-auto overflow-x-hidden"
        : "overflow-auto";

  const blockLenisVertical = axis === "y" || axis === "both";

  return (
    <div
      {...(blockLenisVertical ? { "data-lenis-prevent": true } : {})}
      className={cn(
        "relative min-w-0",
        fade && axis !== "y" && "table-scroll-fade",
        className,
      )}
      {...props}
    >
      <div
        {...(blockLenisVertical
          ? { "data-lenis-prevent": true, "data-lenis-prevent-wheel": true }
          : {})}
        className={cn(
          overflow,
          "scrollbar-thin overscroll-contain [-webkit-overflow-scrolling:touch]",
          axis === "x" && "touch-pan-x overscroll-x-contain",
          axis !== "x" && "touch-pan-y",
        )}
      >
        {children}
      </div>
    </div>
  );
}
