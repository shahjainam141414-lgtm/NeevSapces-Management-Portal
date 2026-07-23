"use client";

import { useMemo, useRef, useState } from "react";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Phone, UserPlus } from "lucide-react";
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
import { inviteAdminUser, updateAdminUser } from "@/app/actions/users";
import type { AdminProfile } from "@/lib/admin-profiles";
import type { UserRole } from "@/lib/nav-config";
import { assignableRoles, canEditUser } from "@/lib/roles";

const phoneDigitsOnly = (value: string) => value.replace(/\D/g, "").slice(0, 12);

const userSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{1,12}$/.test(v), {
      message: "Phone must be numbers only (max 12 digits)",
    }),
  role: z.enum(["Super Admin", "Manager"]),
  status: z.enum(["active", "inactive"]),
});

type UserFormData = z.infer<typeof userSchema>;

type UserFormDialogProps = {
  mode?: "create" | "edit";
  user?: AdminProfile | null;
  actorRole: UserRole;
  isSelf?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreated?: (profile: AdminProfile) => void;
  onUpdated?: (profile: AdminProfile) => void;
  trigger?: React.ReactNode;
};

export function UserFormDialog({
  mode = "create",
  user = null,
  actorRole,
  isSelf = false,
  open: controlledOpen,
  onOpenChange,
  onCreated,
  onUpdated,
  trigger,
}: UserFormDialogProps) {
  const isEdit = mode === "edit";
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const roles = assignableRoles(actorRole);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const formValues = useMemo<UserFormData>(() => {
    if (isEdit && user) {
      return {
        name: user.name,
        email: user.email,
        phone: phoneDigitsOnly(user.phone ?? ""),
        role: user.role,
        status: user.status,
      };
    }
    const roleOptions = assignableRoles(actorRole);
    return {
      name: "",
      email: "",
      phone: "",
      role: roleOptions.includes("Manager")
        ? "Manager"
        : roleOptions[0] ?? "Manager",
      status: "active",
    };
  }, [isEdit, user, actorRole]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    values: formValues,
  });

  const name = useWatch({ control, name: "name" });
  const role = useWatch({ control, name: "role" });
  const status = useWatch({ control, name: "status" });

  const displayPhoto = photoPreview ?? (isEdit ? user?.photo_url ?? null : null);

  const resetLocal = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      resetLocal();
      reset(formValues);
    } else {
      setPhotoFile(null);
      setPhotoPreview(null);
      setFormError(null);
      setFormSuccess(null);
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submitForm = async (data: UserFormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      let photoUrl: string | null = isEdit ? (user?.photo_url ?? null) : null;
      if (photoFile) {
        const uploaded = await uploadToCloudinary(photoFile, "neev/admins");
        photoUrl = uploaded.secure_url;
      }

      const phone = data.phone ? phoneDigitsOnly(data.phone) : "";

      if (isEdit && user) {
        const result = await updateAdminUser({
          id: user.id,
          name: data.name,
          phone: phone || undefined,
          photoUrl,
          role: data.role,
          status: data.status,
        });
        if (!result.ok) {
          setFormError(result.error);
          return;
        }
        onUpdated?.(result.profile);
        setFormSuccess("User updated.");
        window.setTimeout(() => {
          setFormSuccess(null);
          setOpen(false);
        }, 1200);
        return;
      }

      const result = await inviteAdminUser({
        name: data.name,
        email: data.email,
        phone: phone || undefined,
        photoUrl,
        role: data.role,
      });

      if (!result.ok) {
        setFormError(result.error);
        return;
      }

      onCreated?.(result.profile);
      setFormSuccess(result.message);
      reset({
        name: "",
        email: "",
        phone: "",
        role: roles.includes("Manager") ? "Manager" : roles[0] ?? "Manager",
        status: "active",
      });
      setPhotoPreview(null);
      setPhotoFile(null);

      window.setTimeout(() => {
        setFormSuccess(null);
        setOpen(false);
      }, 2200);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save user.",
      );
    }
  };

  const lockRole = isSelf;
  const mayEditTarget =
    !isEdit ||
    !user ||
    canEditUser(actorRole, user.role, isSelf);

  if (isEdit && !mayEditTarget) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      {!isEdit && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Add New User"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update profile details and role permissions."
              : "Sends a welcome invite email so they can set a password."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitForm)} className="space-y-5">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="relative shrink-0">
              <Avatar className="h-16 w-16 ring-2 ring-white shadow-[0_1px_2px_rgba(16,25,46,0.06),0_8px_20px_rgba(22,35,63,0.1)]">
                {displayPhoto ? (
                  <AvatarImage src={displayPhoto} alt="Profile preview" />
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
                disabled={isEdit}
                className={isEdit ? "bg-slate-50 text-slate-500" : undefined}
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
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={12}
                  placeholder="9876543210"
                  className="pl-9"
                  {...register("phone", {
                    onChange: (e) => {
                      const digits = phoneDigitsOnly(e.target.value);
                      e.target.value = digits;
                      setValue("phone", digits, { shouldValidate: true });
                    },
                  })}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={role}
                  disabled={lockRole || roles.length === 0}
                  onValueChange={(v) =>
                    setValue("role", v as UserRole, { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {(lockRole ? [role] : roles).map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {lockRole && (
                  <p className="text-[11px] text-slate-500">
                    You cannot change your own role here.
                  </p>
                )}
              </div>

              {isEdit && !isSelf && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v) =>
                      setValue("status", v as "active" | "inactive", {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {formError && <AlertBanner variant="error">{formError}</AlertBanner>}

          {formSuccess && (
            <AlertBanner variant="success">{formSuccess}</AlertBanner>
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
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isSubmitting
                ? isEdit
                  ? "Saving..."
                  : "Sending invite..."
                : isEdit
                  ? "Save Changes"
                  : "Send Invite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
