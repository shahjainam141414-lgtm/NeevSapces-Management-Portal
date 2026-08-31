"use client";

import { useEffect } from "react";

export const ADMIN_LIST_CHANGED = "neev-admin-list-changed";

export function notifyAdminListChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ADMIN_LIST_CHANGED));
}

/** Replace one row by id, preferring the known id over a possibly-missing API id. */
export function replaceById<T extends { id: string }>(
  items: T[],
  id: string,
  next: T,
): T[] {
  const target = String(id);
  let found = false;
  const mapped = items.map((item) => {
    if (String(item.id) !== target && String(item.id) !== String(next.id)) {
      return item;
    }
    found = true;
    return { ...item, ...next, id: item.id };
  });
  return found ? mapped : [...mapped, next];
}

export function useReloadWhenVisible(reload: () => void) {
  useEffect(() => {
    const onChange = () => reload();
    window.addEventListener(ADMIN_LIST_CHANGED, onChange);
    window.addEventListener("focus", onChange);
    window.addEventListener("pageshow", onChange);
    return () => {
      window.removeEventListener(ADMIN_LIST_CHANGED, onChange);
      window.removeEventListener("focus", onChange);
      window.removeEventListener("pageshow", onChange);
    };
  }, [reload]);
}
