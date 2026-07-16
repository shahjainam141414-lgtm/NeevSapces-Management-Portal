"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertBanner } from "@/components/ui/alert-banner";
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
import { ImageUploadField, ImagePreviewOverlay } from "@/components/ui/image-upload-field";
import { useRemountKey } from "@/hooks/use-remount-key";
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
  const formKey = useRemountKey(open);

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
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  // `key={formKey}` on the parent remounts this component fresh on every
  // open, so this never needs to change after mount — plain const.
  const existingIcon: string | null = initial?.icon_url ?? null;
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

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const shownIcon = clearIcon ? null : localPreview || existingIcon || null;

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

  const removeIcon = () => {
    setFile(null);
    if (localPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(localPreview);
    }
    setLocalPreview(null);
    if (existingIcon) setClearIcon(true);
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
              className="h-11"
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
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </SelectItem>
                  <SelectItem value="inactive">
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
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icon (optional)</Label>
            <ImageUploadField
              previewUrl={shownIcon}
              fileName={file?.name || (shownIcon ? "Current icon" : null)}
              accept={ACCEPT}
              disabled={saving}
              emptyLabel="Upload amenity icon"
              hint={`PNG / SVG / WebP · square works best · max ${MAX_MB}MB`}
              onPick={pickFile}
              onRemove={removeIcon}
              onPreview={() => setFullPreview(true)}
            />
          </div>

          {formError && <AlertBanner variant="error">{formError}</AlertBanner>}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? "Saving..." : mode === "add" ? "Add" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>

      {fullPreview && shownIcon && (
        <ImagePreviewOverlay src={shownIcon} onClose={() => setFullPreview(false)} />
      )}
    </>
  );
}
