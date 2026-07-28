"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthField } from "@/components/auth/auth-field";
import { requestPasswordReset } from "@/app/actions/auth";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type ForgotForm = z.infer<typeof schema>;

function toErrorMessage(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object" && "message" in value) {
    const msg = (value as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
  }
  return fallback;
}

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resentFlash, setResentFlash] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const sendReset = async (email: string) => {
    setFormError(null);
    const result = await requestPasswordReset(email);
    if (!result.ok) {
      setFormError(
        toErrorMessage(result.error, "Could not send reset email. Please try again."),
      );
      return false;
    }
    setSentTo(email);
    return true;
  };

  const onSubmit = async (data: ForgotForm) => {
    await sendReset(data.email.trim().toLowerCase());
  };

  const onResend = async () => {
    if (!sentTo || resending) return;
    setResending(true);
    setResentFlash(false);
    setFormError(null);
    const ok = await sendReset(sentTo);
    setResending(false);
    if (ok) {
      setResentFlash(true);
      window.setTimeout(() => setResentFlash(false), 4000);
    }
  };

  const onEditEmail = () => {
    if (!sentTo) return;
    setValue("email", sentTo);
    setSentTo(null);
    setFormError(null);
    setResentFlash(false);
  };

  if (sentTo) {
    return (
      <AuthLayout title="Check Your Email" subtitle="Password reset link sent">
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3.5">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-800">Email sent</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Sent to
            </p>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-medium text-slate-800">
                {sentTo}
              </p>
              <button
                type="button"
                onClick={onEditEmail}
                className="auth-link shrink-0 text-xs font-semibold uppercase tracking-[0.1em]"
              >
                Edit
              </button>
            </div>
          </div>

          {resentFlash ? (
            <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-center text-xs text-emerald-800">
              Email resent
            </p>
          ) : null}

          {formError ? (
            <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600">
              {formError}
            </p>
          ) : null}

          <button
            type="button"
            disabled={resending}
            onClick={() => void onResend()}
            className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {resending ? "Sending…" : "Resend email"}
          </button>

          <p className="text-center text-sm text-slate-500">
            <Link href="/login" className="auth-link font-semibold">
              Back to sign in
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email and we'll send you a reset link"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <AuthField
          id="email"
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          icon={Mail}
          error={
            typeof errors.email?.message === "string"
              ? errors.email.message
              : undefined
          }
          registration={register("email")}
        />

        {formError ? (
          <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-auth flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3.5 text-sm disabled:opacity-60"
        >
          {isSubmitting ? "Sending…" : "Send Reset Link"}
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/login" className="auth-link font-semibold">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
