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
import { AmenityIcon } from "@/components/customization/amenity-icon";
import { uploadToCloudinary } from "@/lib/cloudinary";
import type { Amenity, AmenityStatus } from "@/lib/amenities";

const formSchema = z.object({
  title: z.string().min(1, "Amenity title is required").max(120),
  status: z.enum(["active", "inactive"]),
  is_default: z.enum(["yes", "no"]),
});

type FormData = z.infer<typeof formSchema>;

type AmenityFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initial?: Amenity | null;
  onSubmit: (data: {
    title: string;
    status: AmenityStatus;
    is_default: boolean;
    icon_url?: string | null;
    cloudinary_public_id?: string | null;
    clearIcon?: boolean;
  }) => Promise<void>;
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/svg+xml,image/jpg";
const MAX_MB = 2;

export function AmenityFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
}: AmenityFormDialogProps) {
  const [wasOpen, setWasOpen] = useState(open);
  const [formKey, setFormKey] = useState(0);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setFormKey((k) => k + 1);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <AmenityFormFields
          key={formKey}
          mode={mode}
          initial={initial}
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  );
}

type AmenityFormFieldsProps = {
  mode: "add" | "edit";
  initial?: Amenity | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: AmenityFormDialogProps["onSubmit"];
};

function AmenityFormFields({
  mode,
  initial,
  onOpenChange,
  onSubmit,
}: AmenityFormFieldsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [existingIcon] = useState<string | null>(initial?.icon_url ?? null);
  const [clearIcon, setClearIcon] = useState(false);
  const [fullPreview, setFullPreview] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initial?.title ?? "",
      status: initial?.status ?? "active",
      is_default: initial?.is_default ? "yes" : "no",
    },
  });

  const status = useWatch({ control, name: "status" });
  const isDefault = useWatch({ control, name: "is_default" });
  const title = useWatch({ control, name: "title" });

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const shownIcon = clearIcon
    ? null
    : localPreview || existingIcon || null;

  const pickFile = (next: File | null) => {
    if (!next) return;
    if (!ACCEPT.split(",").some((t) => next.type === t)) {
      setFormError("Use JPG, PNG, WebP, or SVG icon.");
      return;
    }
    if (next.size > MAX_MB * 1024 * 1024) {
      setFormError(`Icon must be under ${MAX_MB}MB.`);
      return;
    }
    setFormError(null);
    if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
    setFile(next);
    setLocalPreview(URL.createObjectURL(next));
    setClearIcon(false);
  };

  const submitForm = async (data: FormData) => {
    setSaving(true);
    setFormError(null);
    try {
      let icon_url: string | null | undefined = undefined;
      let cloudinary_public_id: string | null | undefined = undefined;

      if (file) {
        const uploaded = await uploadToCloudinary(file, "neev/amenities");
        icon_url = uploaded.secure_url;
        cloudinary_public_id = uploaded.public_id;
      }

      await onSubmit({
        title: data.title.trim(),
        status: data.status,
        is_default: data.is_default === "yes",
        icon_url,
        cloudinary_public_id,
        clearIcon: clearIcon && !file,
      });
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setFormError(
        message.includes("duplicate") || message.includes("unique")
          ? "This amenity already exists."
          : message,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogContent className="max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-5 py-5 sm:px-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              {mode === "add" ? "Add Amenity" : "Edit Amenity"}
            </DialogTitle>
            <DialogDescription>
              Title is required. Icon is optional — upload a flat icon image
              like your amenity references.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form
          onSubmit={handleSubmit(submitForm)}
          className="space-y-5 px-5 py-5 sm:px-6"
        >
          <div className="space-y-2">
            <Label htmlFor="amenity-title">
              Amenities Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amenity-title"
              placeholder="e.g. Swimming Pool"
              className="h-11 border-slate-200"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue("status", value as AmenityStatus, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="h-11 cursor-pointer border-slate-200">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="cursor-pointer">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </SelectItem>
                  <SelectItem value="inactive" className="cursor-pointer">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      Inactive
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Set as Default <span className="text-red-500">*</span>
              </Label>
              <Select
                value={isDefault}
                onValueChange={(value) =>
                  setValue("is_default", value as "yes" | "no", {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="h-11 cursor-pointer border-slate-200">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes" className="cursor-pointer">
                    Yes
                  </SelectItem>
                  <SelectItem value="no" className="cursor-pointer">
                    No
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icon (optional)</Label>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />

            {!shownIcon ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-left transition-colors hover:border-[#1a2744]/35"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                  <ImagePlus className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Upload amenity icon
                  </p>
                  <p className="text-xs text-slate-500">
                    PNG / SVG / WebP · square works best · max {MAX_MB}MB
                  </p>
                </div>
              </button>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-3">
                  {localPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={localPreview}
                      alt="Icon preview"
                      className="h-14 w-14 rounded-2xl border border-slate-100 object-contain p-1"
                    />
                  ) : (
                    <AmenityIcon
                      title={title || "Amenity"}
                      iconUrl={existingIcon}
                      iconKey={initial?.icon_key}
                      size="lg"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {file?.name || "Current icon"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Optional — used on website amenity cards
                    </p>
                  </div>
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
                      if (existingIcon) setClearIcon(true);
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

      {fullPreview && shownIcon && (
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
            src={shownIcon}
            alt="Icon preview"
            className="max-h-[70vh] max-w-full rounded-2xl bg-white object-contain p-6"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
