"use client";

import { useEffect, type RefObject } from "react";
import { bindNestedWheelScroll } from "@/lib/nested-scroll";

/** Attach Lenis-safe wheel scrolling to a nested overflow container. */
export function useNestedWheelScroll(
  ref: RefObject<HTMLElement | null>,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    return bindNestedWheelScroll(el);
  }, [ref, enabled]);
}
