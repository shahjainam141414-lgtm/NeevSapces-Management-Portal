"use client";

import * as React from "react";
import { Eye, ImagePlus, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ImageUploadFieldProps = {
  /** Local preview (blob:) or existing remote URL to display, if any. */
  previewUrl?: string | null;
  /** Rendered inside the empty dropzone and behind a local preview as a fallback. */
  placeholder?: React.ReactNode;
  fileName?: string | null;
  accept?: string;
  disabled?: boolean;
  hint?: React.ReactNode;
  emptyLabel?: string;
  aspect?: "square" | "wide";
  onPick: (file: File) => void;
  onRemove: () => void;
  onPreview?: () => void;
  className?: string;
};

export function ImageUploadField({
  previewUrl,
  placeholder,
  fileName,
  accept = "image/jpeg,image/png,image/webp,image/svg+xml",
  disabled,
  hint,
  emptyLabel = "Upload image",
  aspect = "square",
  onPick,
  onRemove,
  onPreview,
  className,
}: ImageUploadFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className={cn("space-y-0", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPick(file);
          event.target.value = "";
        }}
      />

      {!previewUrl ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className={cn(
            "group flex w-full cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-6 text-center transition-all duration-200 hover:border-[#16233f]/35 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60",
            aspect === "wide" && "py-8",
          )}
        >
          {placeholder}
          <div>
            <p className="text-sm font-medium text-slate-800">{emptyLabel}</p>
            {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16233f] transition-transform duration-200 group-hover:translate-y-[-1px]">
            <ImagePlus className="h-3.5 w-3.5" />
            Choose file
          </span>
        </button>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(16,25,46,0.03)]">
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className={cn(
                "w-full rounded-2xl border border-slate-100 object-contain p-2",
                aspect === "wide" ? "h-32 max-w-full" : "h-20 max-w-[200px]",
              )}
            />
            {fileName && (
              <p className="truncate text-xs text-slate-500">{fileName}</p>
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRemove}
              disabled={disabled}
            >
              <X className="h-3.5 w-3.5" />
              Close
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPreview}
              disabled={disabled || !onPreview}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Change
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Fullscreen lightbox preview overlay, shared across upload dialogs. */
export function ImagePreviewOverlay({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex cursor-pointer items-center justify-center bg-black/70 p-6 animate-overlay-in"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-4 top-4 cursor-pointer rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        onClick={onClose}
        aria-label="Close preview"
      >
        <X className="h-5 w-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Full preview"
        className="max-h-[70vh] max-w-full rounded-2xl bg-white object-contain p-8"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}
