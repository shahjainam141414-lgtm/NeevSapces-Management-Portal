"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import type { EntityItem, OptionStatus } from "@/lib/static-options";

const formSchema = z.object({
  value: z.string().min(1, "This field is required").max(120),
  status: z.enum(["active", "inactive"]),
});

type FormData = z.infer<typeof formSchema>;

type EntityFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityLabel: string;
  mode: "add" | "edit";
  initial?: EntityItem | null;
  onSubmit: (data: { value: string; status: OptionStatus }) => Promise<void>;
};

export function EntityFormDialog({
  open,
  onOpenChange,
  entityLabel,
  mode,
  initial,
  onSubmit,
}: EntityFormDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: "",
      status: "active",
    },
  });

  const status = useWatch({ control, name: "status" });

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    reset({
      value: initial?.name ?? "",
      status: initial?.status ?? "active",
    });
  }, [open, initial, reset]);

  const submitForm = async (data: FormData) => {
    setFormError(null);
    try {
      await onSubmit({ value: data.value.trim(), status: data.status });
      reset({ value: "", status: "active" });
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
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              placeholder={`Enter ${entityLabel.toLowerCase()}`}
              className="h-11 border-slate-200 bg-white"
              {...register("value")}
            />
            {errors.value && (
              <p className="text-xs text-red-500">{errors.value.message}</p>
            )}
          </div>

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
              <SelectTrigger className="h-11 cursor-pointer border-slate-200 bg-white">
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
            {errors.status && (
              <p className="text-xs text-red-500">{errors.status.message}</p>
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
              className="h-10 cursor-pointer"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? mode === "add"
                  ? "Adding..."
                  : "Saving..."
                : mode === "add"
                  ? "Add"
                  : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
