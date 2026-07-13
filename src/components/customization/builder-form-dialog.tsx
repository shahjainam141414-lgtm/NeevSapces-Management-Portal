"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, ImagePlus, Loader2, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BuilderLogo } from "@/components/customization/builder-logo";
import { uploadToCloudinary } from "@/lib/cloudinary";
import type { Builder, BuilderStatus } from "@/lib/builders";

const formSchema = z.object({
  name: z.string().min(1, "Builder name is required").max(120),
  status: z.enum(["active", "inactive"]),
});

type FormData = z.infer<typeof formSchema>;

type BuilderFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initial?: Builder | null;
  onSubmit: (data: {
    name: string;
    status: BuilderStatus;
    logo_url?: string | null;
    cloudinary_public_id?: string | null;
    clearLogo?: boolean;
  }) => Promise<void>;
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/svg+xml,image/jpg";
const MAX_MB = 2;

export function BuilderFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
}: BuilderFormDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [existingLogo, setExistingLogo] = useState<string | null>(null);
  const [clearLogo, setClearLogo] = useState(false);
  const [fullPreview, setFullPreview] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      status: "active",
    },
  });

  const status = useWatch({ control, name: "status" });
  const name = useWatch({ control, name: "name" });

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setLocalPreview(null);
    setClearLogo(false);
    setFullPreview(false);
    setFormError(null);
    setSaving(false);
    setExistingLogo(initial?.logo_url ?? null);
    reset({
      name: initial?.name ?? "",
      status: initial?.status ?? "active",
    });
  }, [open, initial, reset]);

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const shownLogo = clearLogo ? null : localPreview || existingLogo || null;

  const pickFile = (next: File | null) => {
    if (!next) return;
    if (!ACCEPT.split(",").some((t) => next.type === t)) {
      setFormError("Use JPG, PNG, WebP, or SVG logo.");
      return;
    }
    if (next.size > MAX_MB * 1024 * 1024) {
      setFormError(`Logo must be under ${MAX_MB}MB.`);
      return;
    }
    setFormError(null);
    if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
    setFile(next);
    setLocalPreview(URL.createObjectURL(next));
    setClearLogo(false);
  };

  const submitForm = async (data: FormData) => {
    setSaving(true);
    setFormError(null);
    try {
      let logo_url: string | null | undefined = undefined;
      let cloudinary_public_id: string | null | undefined = undefined;

      if (file) {
        const uploaded = await uploadToCloudinary(file, "neev/builders");
        logo_url = uploaded.secure_url;
        cloudinary_public_id = uploaded.public_id;
      }

      await onSubmit({
        name: data.name.trim(),
        status: data.status,
        logo_url,
        cloudinary_public_id,
        clearLogo: clearLogo && !file,
      });
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setFormError(
        message.includes("duplicate") || message.includes("unique")
          ? "This builder already exists."
          : message,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0 sm:max-w-md">
          <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-5 py-5 sm:px-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {mode === "add" ? "Add Builder" : "Edit Builder"}
              </DialogTitle>
              <DialogDescription>
                Name and status are required. Upload the builder&apos;s{" "}
                <strong>original logo</strong> — it is stored on Cloudinary and
                the URL is saved in the database (same as Godrej / Shivalik).
              </DialogDescription>
            </DialogHeader>
          </div>

          <form
            onSubmit={handleSubmit(submitForm)}
            className="space-y-4 px-5 py-5 sm:px-6"
          >
            <div className="space-y-2">
              <Label htmlFor="builder-name">
                Builder Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="builder-name"
                placeholder="e.g. Godrej Properties"
                className="h-11"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue("status", value as BuilderStatus, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="h-11 cursor-pointer">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="cursor-pointer">
                    Active
                  </SelectItem>
                  <SelectItem value="inactive" className="cursor-pointer">
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Original Logo (optional)</Label>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                className="sr-only"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />

              {!shownLogo ? (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex w-full cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition-colors hover:border-[#1a2744]/35"
                >
                  <BuilderLogo name={name || "Builder"} />
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Upload original logo
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Saved to Cloudinary · URL stored in Supabase · PNG/SVG
                      preferred
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a2744]">
                    <ImagePlus className="h-3.5 w-3.5" />
                    Choose file
                  </span>
                </button>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex flex-col items-center gap-3">
                    {localPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={localPreview}
                        alt="Logo preview"
                        className="h-20 w-full max-w-[200px] rounded-2xl border border-slate-100 object-contain p-2"
                      />
                    ) : (
                      <BuilderLogo
                        name={name || "Builder"}
                        logoUrl={existingLogo}
                      />
                    )}
                    <p className="truncate text-xs text-slate-500">
                      {file?.name || "Current logo"}
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => {
                        setFile(null);
                        if (localPreview?.startsWith("blob:")) {
                          URL.revokeObjectURL(localPreview);
                        }
                        setLocalPreview(null);
                        if (existingLogo) setClearLogo(true);
                      }}
                      disabled={saving}
                    >
                      <X className="h-3.5 w-3.5" />
                      Close
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => setFullPreview(true)}
                      disabled={saving}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => inputRef.current?.click()}
                      disabled={saving}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Change
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {formError && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600">
                {formError}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end sm:gap-3">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" className="cursor-pointer" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : mode === "add" ? (
                  "Add"
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {fullPreview && shownLogo && (
        <div
          className="fixed inset-0 z-[80] flex cursor-pointer items-center justify-center bg-black/70 p-6"
          onClick={() => setFullPreview(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 cursor-pointer rounded-full bg-white/10 p-2 text-white"
            onClick={() => setFullPreview(false)}
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shownLogo}
            alt="Logo preview"
            className="max-h-[70vh] max-w-full rounded-2xl bg-white object-contain p-8"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
