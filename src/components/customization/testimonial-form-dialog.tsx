"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useRemountKey } from "@/hooks/use-remount-key";
import type { Testimonial, TestimonialStatus } from "@/lib/testimonials";

const formSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  role: z
    .string()
    .trim()
    .min(2, "Role or locality is required")
    .max(80),
  quote: z
    .string()
    .trim()
    .min(20, "Quote should be at least 20 characters")
    .max(420, "Keep quotes under 420 characters"),
  status: z.enum(["active", "inactive"]),
});

type FormData = z.infer<typeof formSchema>;

export type TestimonialFormSubmitData = {
  name: string;
  role: string;
  quote: string;
  status: TestimonialStatus;
};

type TestimonialFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initial?: Testimonial | null;
  onSubmit: (data: TestimonialFormSubmitData) => Promise<void>;
};

export function TestimonialFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
}: TestimonialFormDialogProps) {
  const formKey = useRemountKey(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <TestimonialFormFields
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

type TestimonialFormFieldsProps = {
  mode: "add" | "edit";
  initial?: Testimonial | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: TestimonialFormDialogProps["onSubmit"];
};

function TestimonialFormFields({
  mode,
  initial,
  onOpenChange,
  onSubmit,
}: TestimonialFormFieldsProps) {
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
      role: initial?.role ?? "",
      quote: initial?.quote ?? "",
      status: initial?.status ?? "active",
    },
  });

  const status = useWatch({ control, name: "status" });

  const submitForm = async (data: FormData) => {
    setSaving(true);
    setFormError(null);
    try {
      await onSubmit({
        name: data.name.trim(),
        role: data.role.trim(),
        quote: data.quote.trim(),
        status: data.status,
      });
      onOpenChange(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0 sm:max-w-lg">
      <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-5 py-5 sm:px-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {mode === "add" ? "Add testimonial" : "Edit testimonial"}
          </DialogTitle>
          <DialogDescription>
            Client name, locality, and the quote shown on the homepage.
          </DialogDescription>
        </DialogHeader>
      </div>

      <form
        onSubmit={handleSubmit(submitForm)}
        className="space-y-4 px-5 py-5 sm:px-6"
      >
        <div className="space-y-2">
          <Label htmlFor="testimonial-name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="testimonial-name"
            placeholder="e.g. Hetal Patel"
            className="h-11"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="testimonial-role">
            Role / locality <span className="text-red-500">*</span>
          </Label>
          <Input
            id="testimonial-role"
            placeholder="e.g. Homeowner, Chandkheda"
            className="h-11"
            {...register("role")}
          />
          {errors.role && (
            <p className="text-xs text-red-500">{errors.role.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="testimonial-quote">
            Quote <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="testimonial-quote"
            placeholder="What they said about working with Neev…"
            className="min-h-[120px] resize-y"
            {...register("quote")}
          />
          {errors.quote && (
            <p className="text-xs text-red-500">{errors.quote.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            Status <span className="text-red-500">*</span>
          </Label>
          <Select
            value={status}
            onValueChange={(value) =>
              setValue("status", value as TestimonialStatus, {
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
  );
}
