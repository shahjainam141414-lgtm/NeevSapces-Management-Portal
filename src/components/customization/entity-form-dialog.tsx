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
import {
  ImageUploadField,
  ImagePreviewOverlay,
} from "@/components/ui/image-upload-field";
import { useRemountKey } from "@/hooks/use-remount-key";
import { uploadToCloudinary } from "@/lib/cloudinary";
import type { EntityItem, OptionStatus } from "@/lib/static-options";

const formSchema = z.object({
  value: z.string().min(1, "This field is required").max(120),
  status: z.enum(["active", "inactive"]),
});

type FormData = z.infer<typeof formSchema>;

export type EntityFormSubmitData = {
  value: string;
  status: OptionStatus;
  image_url?: string | null;
  cloudinary_public_id?: string | null;
  clearImage?: boolean;
};

type EntityFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityLabel: string;
  mode: "add" | "edit";
  initial?: EntityItem | null;
  /** When true, show a single image upload (used for Areas). */
  enableImage?: boolean;
  onSubmit: (data: EntityFormSubmitData) => Promise<void>;
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/jpg";
const MAX_MB = 4;

export function EntityFormDialog({
  open,
  onOpenChange,
  entityLabel,
  mode,
  initial,
  enableImage = false,
  onSubmit,
}: EntityFormDialogProps) {
  const formKey = useRemountKey(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <EntityFormFields
          key={formKey}
          entityLabel={entityLabel}
          mode={mode}
          initial={initial}
          enableImage={enableImage}
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  );
}

type EntityFormFieldsProps = {
  entityLabel: string;
  mode: "add" | "edit";
  initial?: EntityItem | null;
  enableImage: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: EntityFormDialogProps["onSubmit"];
};

function EntityFormFields({
  entityLabel,
  mode,
  initial,
  enableImage,
  onOpenChange,
  onSubmit,
}: EntityFormFieldsProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const existingImage: string | null = initial?.image_url ?? null;
  const [clearImage, setClearImage] = useState(false);
  const [fullPreview, setFullPreview] = useState(false);
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
      value: initial?.name ?? "",
      status: initial?.status ?? "active",
    },
  });

  const status = useWatch({ control, name: "status" });

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const shownImage = clearImage ? null : localPreview || existingImage || null;

  const pickFile = (next: File) => {
    if (!ACCEPT.split(",").some((t) => next.type === t)) {
      setFormError("Use JPG, PNG, or WebP image.");
      return;
    }
    if (next.size > MAX_MB * 1024 * 1024) {
      setFormError(`Image must be under ${MAX_MB}MB.`);
      return;
    }
    setFormError(null);
    if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
    setFile(next);
    setLocalPreview(URL.createObjectURL(next));
    setClearImage(false);
  };

  const removeImage = () => {
    setFile(null);
    if (localPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(localPreview);
    }
    setLocalPreview(null);
    if (existingImage) setClearImage(true);
  };

  const submitForm = async (data: FormData) => {
    setSaving(true);
    setFormError(null);
    try {
      let image_url: string | null | undefined = undefined;
      let cloudinary_public_id: string | null | undefined = undefined;

      if (enableImage && file) {
        const uploaded = await uploadToCloudinary(file, "neev/areas");
        image_url = uploaded.secure_url;
        cloudinary_public_id = uploaded.public_id;
      }

      await onSubmit({
        value: data.value.trim(),
        status: data.status,
        ...(enableImage
          ? {
              image_url,
              cloudinary_public_id,
              clearImage: clearImage && !file,
            }
          : {}),
      });
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setFormError(
        message.includes("duplicate") || message.includes("unique")
          ? `This ${entityLabel.toLowerCase()} already exists.`
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
            <DialogTitle className="text-lg font-semibold tracking-tight text-slate-900">
              {mode === "add" ? `Add ${entityLabel}` : `Edit ${entityLabel}`}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {mode === "add"
                ? `Create a new ${entityLabel.toLowerCase()} for your listings.`
                : `Update this ${entityLabel.toLowerCase()}.`}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form
          onSubmit={handleSubmit(submitForm)}
          className="space-y-5 px-5 py-5 sm:px-6"
        >
          <div className="space-y-2">
            <Label htmlFor="entity-value" className="text-slate-700">
              {entityLabel} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="entity-value"
              placeholder={`Enter ${entityLabel.toLowerCase()} name`}
              className="h-11"
              {...register("value")}
            />
            {errors.value && (
              <p className="text-xs text-red-500">{errors.value.message}</p>
            )}
          </div>

          {enableImage ? (
            <div className="space-y-2">
              <Label className="text-slate-700">Area image</Label>
              <ImageUploadField
                previewUrl={shownImage}
                fileName={
                  file?.name || (shownImage ? "Current image" : null)
                }
                accept={ACCEPT}
                disabled={saving}
                aspect="wide"
                emptyLabel="Upload area image"
                hint={`JPG / PNG / WebP · landscape works best · max ${MAX_MB}MB`}
                onPick={pickFile}
                onRemove={removeImage}
                onPreview={() => shownImage && setFullPreview(true)}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label className="text-slate-700">
              Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={status}
              onValueChange={(value) =>
                setValue("status", value as OptionStatus, {
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
            {errors.status && (
              <p className="text-xs text-red-500">{errors.status.message}</p>
            )}
          </div>

          {formError && <AlertBanner variant="error">{formError}</AlertBanner>}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" className="h-10" disabled={saving} loading={saving}>
              {mode === "add" ? "Add" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>

      {enableImage && shownImage && fullPreview ? (
        <ImagePreviewOverlay
          src={shownImage}
          onClose={() => setFullPreview(false)}
        />
      ) : null}
    </>
  );
}
