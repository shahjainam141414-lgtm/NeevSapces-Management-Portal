"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  ImagePlus,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clearMainBanner, getMainBanner, upsertMainBanner } from "@/lib/banners-api";
import {
  isCloudinaryConfigured,
  uploadToCloudinary,
} from "@/lib/cloudinary";
import type { SiteBanner } from "@/lib/banners";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,image/jpg";
const MAX_MB = 5;

export function MainBannerPageContent() {
  const [banner, setBanner] = useState<SiteBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const row = await getMainBanner();
      setBanner(row);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load banner. Run the site_banners SQL migration first.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaved = (saved: SiteBanner) => {
    setBanner(saved);
    setEditorOpen(false);
  };

  const handleRemove = async () => {
    if (!banner) return;
    setRemoving(true);
    try {
      await clearMainBanner();
      setBanner(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove banner");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden border-slate-200/70 bg-white/90 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100/80 bg-gradient-to-b from-slate-50/80 to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              Main Banner
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Website homepage hero image shown at the top of the site.
            </p>
          </div>
          <Button
            className="h-10 w-full cursor-pointer sm:w-auto"
            onClick={() => setEditorOpen(true)}
          >
            {banner ? (
              <>
                <Pencil className="h-4 w-4" />
                Change Banner
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4" />
                Add Banner
              </>
            )}
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 p-4 sm:p-6">
          {!isCloudinaryConfigured() && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Cloudinary env vars are missing. You can still pick and preview images
              locally; upload will work after you add{" "}
              <code className="rounded bg-amber-100 px-1 text-xs">
                NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
              </code>{" "}
              and{" "}
              <code className="rounded bg-amber-100 px-1 text-xs">
                NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
              </code>
              .
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
              <button
                type="button"
                className="ml-2 cursor-pointer font-semibold underline"
                onClick={() => void load()}
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500 sm:h-64">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading banner...
            </div>
          ) : banner ? (
            <div className="space-y-3">
              <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                <div className="relative aspect-[21/9] w-full sm:aspect-[3/1]">
                  <Image
                    src={banner.image_url}
                    alt="Main website banner"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 960px"
                    priority
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-end gap-2 bg-gradient-to-t from-black/55 to-transparent p-3 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="cursor-pointer bg-white/95"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => setEditorOpen(true)}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Change
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500 sm:text-sm">
                  Recommended size: 1920×640 or wider. JPG / PNG / WebP up to {MAX_MB}MB.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => void handleRemove()}
                  disabled={removing}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {removing ? "Removing..." : "Remove"}
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className="flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-14 text-center transition-colors hover:border-[#1a2744]/35 hover:bg-slate-50 sm:py-20"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <ImagePlus className="h-5 w-5 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                No main banner yet
              </p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Upload a wide website banner image for the homepage hero.
              </p>
              <span className="mt-4 inline-flex h-10 items-center rounded-lg bg-[#1a2744] px-4 text-sm font-medium text-white">
                Add Banner
              </span>
            </button>
          )}
        </CardContent>
      </Card>

      <BannerEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        currentUrl={banner?.image_url}
        onSaved={handleSaved}
      />

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] overflow-hidden p-0 sm:max-w-4xl">
          <div className="relative aspect-[21/9] w-full bg-slate-950">
            {banner && (
              <Image
                src={banner.image_url}
                alt="Banner preview"
                fill
                className="object-contain"
                sizes="100vw"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

type BannerEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUrl?: string;
  onSaved: (banner: SiteBanner) => void;
};

function BannerEditorDialog({
  open,
  onOpenChange,
  currentUrl,
  onSaved,
}: BannerEditorDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fullPreview, setFullPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setPreviewUrl(null);
    setFullPreview(false);
    setFormError(null);
    setSaving(false);
  }, [open]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const pickFile = (next: File | null) => {
    if (!next) return;
    if (!ACCEPT.split(",").includes(next.type)) {
      setFormError("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (next.size > MAX_MB * 1024 * 1024) {
      setFormError(`Image must be under ${MAX_MB}MB.`);
      return;
    }
    setFormError(null);
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleChange = () => {
    inputRef.current?.click();
  };

  const handleSave = async () => {
    if (!file) {
      setFormError("Choose an image first.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const uploaded = await uploadToCloudinary(file, "neev/banners");
      const saved = await upsertMainBanner({
        image_url: uploaded.secure_url,
        cloudinary_public_id: uploaded.public_id,
      });
      onSaved(saved);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Upload failed. Try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const shown = previewUrl;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0 sm:max-w-lg">
          <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-5 py-5 sm:px-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {currentUrl ? "Change Banner" : "Add Banner"}
              </DialogTitle>
              <DialogDescription>
                Upload a wide image for the website homepage banner.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-4 px-5 py-5 sm:px-6">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />

            {!shown ? (
              <button
                type="button"
                onClick={handleChange}
                className={cn(
                  "flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 transition-colors hover:border-[#1a2744]/40 hover:bg-slate-50",
                )}
              >
                <Upload className="mb-2 h-6 w-6 text-slate-400" />
                <p className="text-sm font-medium text-slate-800">
                  Click to upload image
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  JPG, PNG, WebP · max {MAX_MB}MB · 1920×640 recommended
                </p>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  <div className="relative aspect-[21/9] w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={shown}
                      alt="Selected banner preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                {file && (
                  <p className="truncate text-xs text-slate-500">
                    {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={handleClose}
                    disabled={saving}
                  >
                    <X className="h-4 w-4" />
                    Close
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => setFullPreview(true)}
                    disabled={saving}
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={handleChange}
                    disabled={saving}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Change
                  </Button>
                </div>
              </div>
            )}

            {formError && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600">
                {formError}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={handleClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="cursor-pointer"
                onClick={() => void handleSave()}
                disabled={saving || !file}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Save Banner
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {fullPreview && shown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setFullPreview(false)}
          >
            <button
              type="button"
              className="absolute right-4 top-4 cursor-pointer rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              onClick={() => setFullPreview(false)}
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-5xl overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shown}
                alt="Full banner preview"
                className="max-h-[80vh] w-full object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
