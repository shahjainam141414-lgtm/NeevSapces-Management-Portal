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
  const formKey = useRemountKey(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <BuilderFormFields
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

type BuilderFormFieldsProps = {
  mode: "add" | "edit";
  initial?: Builder | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: BuilderFormDialogProps["onSubmit"];
};

function BuilderFormFields({
  mode,
  initial,
  onOpenChange,
  onSubmit,
}: BuilderFormFieldsProps) {
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  // `key={formKey}` on the parent remounts this component fresh on every
  // open, so this never needs to change after mount — plain const.
  const existingLogo: string | null = initial?.logo_url ?? null;
  const [clearLogo, setClearLogo] = useState(false);
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
      name: initial?.name ?? "",
      status: initial?.status ?? "active",
    },
  });

  const status = useWatch({ control, name: "status" });
  const name = useWatch({ control, name: "name" });

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

  const removeLogo = () => {
    setFile(null);
    if (localPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(localPreview);
    }
    setLocalPreview(null);
    if (existingLogo) setClearLogo(true);
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
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Original Logo (optional)</Label>
            <ImageUploadField
              previewUrl={shownLogo}
              placeholder={<BuilderLogo name={name || "Builder"} />}
              fileName={file?.name || (shownLogo ? "Current logo" : null)}
              accept={ACCEPT}
              disabled={saving}
              aspect="wide"
              emptyLabel="Upload original logo"
              hint="Saved to Cloudinary · URL stored in Supabase · PNG/SVG preferred"
              onPick={pickFile}
              onRemove={removeLogo}
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

      {fullPreview && shownLogo && (
        <ImagePreviewOverlay src={shownLogo} onClose={() => setFullPreview(false)} />
      )}
    </>
  );
}
