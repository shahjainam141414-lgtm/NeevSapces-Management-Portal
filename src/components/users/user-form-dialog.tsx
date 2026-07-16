"use client";

import { useRef, useState } from "react";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Check, Copy, Phone, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertBanner } from "@/components/ui/alert-banner";
import { getInitials } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { inviteAdminUser } from "@/app/actions/users";
import type { AdminProfile } from "@/lib/admin-profiles";

const userSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

type UserFormDialogProps = {
  onCreated?: (profile: AdminProfile) => void;
};

export function UserFormDialog({ onCreated }: UserFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const name = useWatch({ control, name: "name" });

  const resetLocal = () => {
    reset();
    setPhotoPreview(null);
    setPhotoFile(null);
    setFormError(null);
    setFormSuccess(null);
    setInviteLink(null);
    setCopied(false);
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const submitForm = async (data: UserFormData) => {
    setFormError(null);
    setFormSuccess(null);
    setInviteLink(null);
    setCopied(false);
    try {
      let photoUrl: string | null = null;
      if (photoFile) {
        const uploaded = await uploadToCloudinary(photoFile, "neev/admins");
        photoUrl = uploaded.secure_url;
      }

      const result = await inviteAdminUser({
        name: data.name,
        email: data.email,
        phone: data.phone,
        photoUrl,
      });

      if (!result.ok) {
        setFormError(result.error);
        return;
      }

      onCreated?.(result.profile);
      setFormSuccess(result.message);
      reset();
      setPhotoPreview(null);
      setPhotoFile(null);

      if (result.inviteLink) {
        setInviteLink(result.inviteLink);
        return;
      }

      window.setTimeout(() => {
        setFormSuccess(null);
        setOpen(false);
      }, 2200);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to invite user.",
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetLocal();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Sends a welcome invite email so they can set a password. Only
            emails you add here can access the admin panel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitForm)} className="space-y-5">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="relative shrink-0">
              <Avatar className="h-16 w-16 ring-2 ring-white shadow-[0_1px_2px_rgba(16,25,46,0.06),0_8px_20px_rgba(22,35,63,0.1)]">
                {photoPreview ? (
                  <AvatarImage src={photoPreview} alt="Profile preview" />
                ) : (
                  <AvatarFallback className="text-base">
                    {name ? getInitials(name) : "NA"}
                  </AvatarFallback>
                )}
              </Avatar>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-white bg-[#16233f] text-white shadow-[0_2px_8px_rgba(22,35,63,0.35)] transition-all duration-200 hover:bg-[#1f3157] hover:scale-105 active:scale-95"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handlePhotoChange}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Profile Photo</p>
              <p className="text-xs text-slate-500">Optional — JPG or PNG</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter full name"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@neevspaces.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  className="pl-9"
                  {...register("phone")}
                />
              </div>
            </div>
          </div>

          {formError && <AlertBanner variant="error">{formError}</AlertBanner>}

          {formSuccess && (
            <AlertBanner variant="success">
              <div className="space-y-3">
                <p>{formSuccess}</p>
                {inviteLink && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-emerald-900">
                      Invite link
                    </p>
                    <p className="break-all rounded-lg bg-white/80 px-2 py-1.5 text-[11px] text-slate-600">
                      {inviteLink}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void copyInviteLink()}
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy link
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </AlertBanner>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetLocal();
                setOpen(false);
              }}
            >
              {inviteLink ? "Done" : "Cancel"}
            </Button>
            {!inviteLink && (
              <Button type="submit" loading={isSubmitting}>
                {isSubmitting ? "Sending invite..." : "Send Invite"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
