"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, CreditCard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
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
import { uploadToCloudinary } from "@/lib/cloudinary";
import {
  getDigitalCardByProfileId,
  updateDigitalCard,
} from "@/app/actions/digital-cards";
import {
  CARD_COMPANY,
  DEFAULT_CARD_TAGLINE,
  digitsOnly,
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
  email: z.string().email("Valid email is required"),
  officeAddress: z.string().min(8, "Address is required"),
  rera: z.string().min(4, "RERA is required"),
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
  const [photoCleared, setPhotoCleared] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const defaults = useMemo<FormData>(() => {
    if (card) {
      return {
        displayName: card.display_name,
        roleTitle: card.role_title,
        tagline: card.tagline || DEFAULT_CARD_TAGLINE,
        phone: digitsOnly(card.phone_tel || card.phone_display)
          .replace(/^91/, "")
          .slice(0, 12),
        email: card.email,
        officeAddress: card.office_address || CARD_COMPANY.address,
        rera: card.rera || CARD_COMPANY.rera,
        status: card.status,
      };
    }
    return {
      displayName: user?.name ?? "",
      roleTitle: "Property Advisor",
      tagline: DEFAULT_CARD_TAGLINE,
      phone: digitsOnly(user?.phone ?? ""),
      email: user?.email ?? "",
      officeAddress: CARD_COMPANY.address,
      rera: CARD_COMPANY.rera,
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
    setPhotoCleared(false);
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

  const storedPhoto = card?.photo_url ?? user?.photo_url ?? null;
  const displayPhoto = photoCleared
    ? null
    : (photoPreview ?? storedPhoto ?? null);

  const clearPhoto = () => {
    setPhotoCleared(true);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setFormError(null);
    setFormSuccess(null);
    try {
      let photoUrl: string | null = photoCleared ? null : storedPhoto;
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
        email: data.email,
        photoUrl,
        status: data.status,
        officeAddress: data.officeAddress,
        rera: data.rera,
      });

      if (!result.ok) {
        setFormError(result.error);
        return;
      }

      setCard(result.card);
      setPhotoCleared(false);
      setPhotoFile(null);
      setPhotoPreview(null);
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
      <DialogContent className="flex max-h-[min(92dvh,880px)] w-[calc(100vw-1.25rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg sm:w-full">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-4 py-4 pr-12 text-left sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CreditCard className="h-4 w-4 shrink-0 text-[var(--brand)]" />
            Edit digital card
          </DialogTitle>
        </DialogHeader>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 [-webkit-overflow-scrolling:touch]"
          onWheel={(e) => e.stopPropagation()}
        >
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Loading card…
            </p>
          ) : (
            <form
              id="digital-card-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {formError && (
                <AlertBanner variant="warning">{formError}</AlertBanner>
              )}
              {formSuccess && (
                <AlertBanner variant="success">{formSuccess}</AlertBanner>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="relative mx-auto w-fit sm:mx-0">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="relative cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16233f]/25"
                    aria-label="Upload card photo"
                  >
                    <Avatar className="size-16 sm:size-[4.25rem]">
                      {displayPhoto ? (
                        <AvatarImage src={displayPhoto} alt="" />
                      ) : null}
                      <AvatarFallback className="bg-[#101a2c] p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/logo-white.png"
                          alt="Neev Spaces"
                          className="h-auto w-full object-contain"
                        />
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 grid size-7 place-items-center rounded-full border border-white bg-slate-900 text-white shadow-sm">
                      <Camera className="h-3.5 w-3.5" />
                    </span>
                  </button>
                  {displayPhoto ? (
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove card photo"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.4} />
                    </button>
                  ) : null}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPhotoCleared(false);
                    setPhotoFile(file);
                    const reader = new FileReader();
                    reader.onload = () =>
                      setPhotoPreview(reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
                <p className="text-center text-xs leading-relaxed text-slate-500 sm:text-left">
                  Card photo (optional). Tap to upload
                  {displayPhoto ? ", or use × to remove" : ""}.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="dc-name">Display name</Label>
                  <Input id="dc-name" {...register("displayName")} />
                  {errors.displayName && (
                    <p className="text-xs text-red-600">
                      {errors.displayName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="dc-role">Role title</Label>
                  <Input id="dc-role" {...register("roleTitle")} />
                  {errors.roleTitle && (
                    <p className="text-xs text-red-600">
                      {errors.roleTitle.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="dc-tagline">Tagline</Label>
                  <Input id="dc-tagline" {...register("tagline")} />
                  {errors.tagline && (
                    <p className="text-xs text-red-600">
                      {errors.tagline.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dc-phone">Phone</Label>
                  <Input
                    id="dc-phone"
                    inputMode="numeric"
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Card status</Label>
                  <Select
                    value={status}
                    onValueChange={(v) =>
                      setValue("status", v as "active" | "inactive")
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="dc-email">Email</Label>
                  <Input id="dc-email" type="email" {...register("email")} />
                  {errors.email && (
                    <p className="text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="dc-address">Address</Label>
                  <Textarea
                    id="dc-address"
                    rows={3}
                    className="min-h-[88px] resize-y"
                    {...register("officeAddress")}
                  />
                  {errors.officeAddress && (
                    <p className="text-xs text-red-600">
                      {errors.officeAddress.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="dc-rera">RERA</Label>
                  <Input id="dc-rera" {...register("rera")} />
                  {errors.rera && (
                    <p className="text-xs text-red-600">{errors.rera.message}</p>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>

        {!loading ? (
          <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  reset(defaults);
                  setPhotoCleared(false);
                  setPhotoFile(null);
                  setPhotoPreview(null);
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="digital-card-form"
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving…" : "Save card"}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
