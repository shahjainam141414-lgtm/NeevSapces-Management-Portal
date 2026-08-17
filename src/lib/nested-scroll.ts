/**
 * Nested scroll helpers for Lenis (smooth page scroll).
 * Without these, dropdowns/modals/side panels lose wheel scroll.
 */

function isScrollableOverflow(value: string) {
  return value === "auto" || value === "scroll" || value === "overlay";
}

/** True when Lenis should ignore this wheel target so nested areas can scroll. */
export function shouldPreventLenis(node: HTMLElement): boolean {
  if (
    node.closest("[data-lenis-prevent]") ||
    node.closest("[data-lenis-prevent-wheel]") ||
    node.closest('[role="dialog"]') ||
    node.closest('[role="listbox"]') ||
    node.closest('[role="menu"]') ||
    node.closest('[aria-modal="true"]') ||
    node.closest("[cmdk-list]") ||
    node.closest("[data-radix-select-viewport]") ||
    node.closest("[data-radix-popper-content-wrapper]")
  ) {
    return true;
  }

  let el: HTMLElement | null = node;
  while (el && el !== document.body && el !== document.documentElement) {
    const style = window.getComputedStyle(el);
    const canY =
      isScrollableOverflow(style.overflowY) &&
      el.scrollHeight > el.clientHeight + 1;
    const canX =
      isScrollableOverflow(style.overflowX) &&
      el.scrollWidth > el.clientWidth + 1;
    if (canY || canX) return true;
    el = el.parentElement;
  }

  return false;
}

/** Keep wheel events scrolling a nested container instead of the page. */
export function bindNestedWheelScroll(el: HTMLElement) {
  const onWheel = (event: WheelEvent) => {
    event.stopPropagation();
    event.preventDefault();
    el.scrollTop += event.deltaY;
    el.scrollLeft += event.deltaX;
  };
  el.addEventListener("wheel", onWheel, { passive: false });
  return () => el.removeEventListener("wheel", onWheel);
}
