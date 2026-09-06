"use client";

import {
  useCallback,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

export type ConfirmDeleteRequest = {
  title?: string;
  description?: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
};

export function useConfirmDelete() {
  const [pending, setPending] = useState<ConfirmDeleteRequest | null>(null);
  const [loading, setLoading] = useState(false);

  const requestDelete = useCallback((request: ConfirmDeleteRequest) => {
    setPending(request);
  }, []);

  const close = useCallback(() => {
    if (loading) return;
    setPending(null);
  }, [loading]);

  const handleConfirm = useCallback(async () => {
    if (!pending) return;
    setLoading(true);
    try {
      await pending.onConfirm();
      setPending(null);
    } finally {
      setLoading(false);
    }
  }, [pending]);

  const dialog: ReactElement = (
    <ConfirmDeleteDialog
      open={Boolean(pending)}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      title={pending?.title}
      description={pending?.description}
      confirmLabel={pending?.confirmLabel}
      loading={loading}
      onConfirm={() => void handleConfirm()}
    />
  );

  return { requestDelete, dialog, isConfirming: loading };
}
