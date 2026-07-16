"use client";

import { useState } from "react";

/**
 * Returns a key that increments each time `open` transitions from false to
 * true. Pass it as `key={key}` on a dialog's inner form component to force a
 * fresh remount (and thus fresh internal state) every time the dialog reopens,
 * instead of reusing stale state from the previous open.
 */
export function useRemountKey(open: boolean): number {
  const [wasOpen, setWasOpen] = useState(open);
  const [formKey, setFormKey] = useState(0);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setFormKey((k) => k + 1);
  }

  return formKey;
}
