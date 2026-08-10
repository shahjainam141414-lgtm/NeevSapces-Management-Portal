"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, CreditCard } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertBanner } from "@/components/ui/alert-banner";
import { getInitials } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/cloudinary";
import {
  getDigitalCardByProfileId,
  updateDigitalCard,
} from "@/app/actions/digital-cards";
import {
  CARD_COMPANY,
  digitsOnly,
  getCardPublicUrl,
  type DigitalCard,
} from "@/lib/digital-cards";
import type { AdminProfile } from "@/lib/admin-profiles";

const schema = z.object({
  displayName: z.string().min(2, "Name is required"),
  roleTitle: z.string().min(2, "Role is required"),
  tagline: z.string().min(4, "Tagline is required"),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{1,12}$/.test(v), {
      message: "Phone must be numbers only (max 12 digits)",
    }),
  whatsapp: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{10,15}$/.test(v), {
      message: "WhatsApp must be digits (10–15)",
    }),
  email: z.string().email("Valid email is required"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, hyphens"),
  accent: z.enum(["steel", "bronze"]),
  status: z.enum(["active", "inactive"]),
});

type FormData = z.infer<typeof schema>;

type Props = {
  user: AdminProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DigitalCardFormDialog({ user, open, onOpenChange }: Props) {
  const [card, setCard] = useState<DigitalCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const defaults = useMemo<FormData>(() => {
    if (card) {
      return {
        displayName: card.display_name,
        roleTitle: card.role_title,
        tagline: card.tagline,
        phone: digitsOnly(card.phone_tel || card.phone_display).replace(/^91/, "").slice(0, 12),
        whatsapp: card.whatsapp || "",
        email: card.email,
        slug: card.slug,
        accent: card.accent,
        status: card.status,
      };
    }
    return {
      displayName: user?.name ?? "",
      roleTitle: "Property Advisor",
      tagline: "Private guidance for homes that feel like the right beginning.",
      phone: digitsOnly(user?.phone ?? ""),
      whatsapp: "",
      email: user?.email ?? "",
      slug: "",
      accent: "steel",
      status: "active",
    };
  }, [card, user]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: defaults,
  });

  const accent = useWatch({ control, name: "accent" });
  const status = useWatch({ control, name: "status" });
  const displayName = useWatch({ control, name: "displayName" });

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    setLoading(true);
    setFormError(null);
    setFormSuccess(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    void getDigitalCardByProfileId(user.id).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (!result.ok) {
        setFormError(result.error);
        setCard(null);
        return;
      }
      setCard(result.card);
    });
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  const displayPhoto =
    photoPreview ?? card?.photo_url ?? user?.photo_url ?? null;

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setFormError(null);
    setFormSuccess(null);
    try {
      let photoUrl: string | null = card?.photo_url ?? user.photo_url ?? null;
      if (photoFile) {
        const uploaded = await uploadToCloudinary(photoFile, "neev/cards");
        photoUrl = uploaded.secure_url;
      }

      const result = await updateDigitalCard({
        adminProfileId: user.id,
        displayName: data.displayName,
        roleTitle: data.roleTitle,
        tagline: data.tagline,
        phone: data.phone || undefined,
        whatsapp: data.whatsapp || undefined,
        email: data.email,
        accent: data.accent,
        photoUrl,
        status: data.status,
        slug: data.slug,
      });

      if (!result.ok) {
        setFormError(result.error);
        return;
      }

      setCard(result.card);
      setFormSuccess("Digital card saved.");
      window.setTimeout(() => {
        setFormSuccess(null);
        onOpenChange(false);
      }, 1100);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save card.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[var(--brand)]" />
            Edit digital card
          </DialogTitle>
          <DialogDescription>
            Public link:{" "}
            {card ? (
              <a
                href={getCardPublicUrl(card.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--brand)] underline-offset-2 hover:underline"
              >
                {getCardPublicUrl(card.slug)}
              </a>
            ) : (
              "saving creates the public card page"
            )}
            . Address & RERA stay company-wide ({CARD_COMPANY.address.split(",")[0]}…).
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading card…</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {formError && <AlertBanner variant="warning">{formError}</AlertBanner>}
            {formSuccess && (
              <AlertBanner variant="success">{formSuccess}</AlertBanner>
            )}

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative cursor-pointer"
              >
                <Avatar className="size-16">
                  {displayPhoto ? (
                    <AvatarImage src={displayPhoto} alt="" />
                  ) : null}
                  <AvatarFallback>
                    {getInitials(displayName || user?.name || "NS")}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border border-white bg-slate-900 text-white">
                  <Camera className="h-3.5 w-3.5" />
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setPhotoFile(file);
                  const reader = new FileReader();
                  reader.onload = () => setPhotoPreview(reader.result as string);
                  reader.readAsDataURL(file);
                }}
              />
              <p className="text-xs text-slate-500">
                Card photo (optional). Uses Cloudinary folder neev/cards.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="dc-name">Display name</Label>
                <Input id="dc-name" {...register("displayName")} />
                {errors.displayName && (
                  <p className="text-xs text-red-600">{errors.displayName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dc-role">Role title</Label>
                <Input id="dc-role" {...register("roleTitle")} />
                {errors.roleTitle && (
                  <p className="text-xs text-red-600">{errors.roleTitle.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dc-slug">URL slug</Label>
                <Input id="dc-slug" {...register("slug")} />
                {errors.slug && (
                  <p className="text-xs text-red-600">{errors.slug.message}</p>
                )}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="dc-tagline">Tagline</Label>
                <Input id="dc-tagline" {...register("tagline")} />
                {errors.tagline && (
                  <p className="text-xs text-red-600">{errors.tagline.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dc-phone">Phone</Label>
                <Input id="dc-phone" inputMode="numeric" {...register("phone")} />
                {errors.phone && (
                  <p className="text-xs text-red-600">{errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dc-wa">WhatsApp (digits)</Label>
                <Input
                  id="dc-wa"
                  placeholder="917600271405"
                  inputMode="numeric"
                  {...register("whatsapp")}
                />
                {errors.whatsapp && (
                  <p className="text-xs text-red-600">{errors.whatsapp.message}</p>
                )}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="dc-email">Email</Label>
                <Input id="dc-email" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Accent</Label>
                <Select
                  value={accent}
                  onValueChange={(v) =>
                    setValue("accent", v as "steel" | "bronze")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="steel">Steel</SelectItem>
                    <SelectItem value="bronze">Bronze</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Card status</Label>
                <Select
                  value={status}
                  onValueChange={(v) =>
                    setValue("status", v as "active" | "inactive")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset(defaults);
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save card"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
