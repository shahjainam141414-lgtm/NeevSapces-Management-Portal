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
 * Marks itself for Lenis so nested scroll (tables, tab strips) stays usable.
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

  return (
    <div
      data-lenis-prevent
      className={cn(
        "relative min-w-0",
        fade && axis !== "y" && "table-scroll-fade",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          overflow,
          "overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]",
          axis !== "x" && "touch-pan-y",
          "scrollbar-thin",
        )}
      >
        {children}
      </div>
    </div>
  );
}
