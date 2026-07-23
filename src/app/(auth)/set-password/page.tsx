"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthField } from "@/components/auth/auth-field";
import { createClient } from "@/lib/supabase/client";
import { setInvitedUserPassword } from "@/app/actions/auth";

const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

async function clearClientSession() {
  const supabase = createClient();
  try {
    await supabase.auth.signOut({ scope: "global" });
  } catch {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }
}

function SetPasswordForm() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [goingToLogin, setGoingToLogin] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    const supabase = createClient();

    function markReady(userId: string, email?: string | null) {
      setSessionUserId(userId);
      setInviteEmail((email ?? "").trim().toLowerCase() || null);
      setSessionReady(true);
      setCheckingSession(false);
      try {
        sessionStorage.setItem("neev_set_password_ok", userId);
      } catch {
        // ignore
      }
    }

    async function clearLeftoverSession() {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // ignore
      }
    }

    async function ensureSession() {
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const otpType = searchParams.get("type");
      const hash =
        typeof window !== "undefined" ? window.location.hash : "";
      const hashParams = hash.includes("access_token")
        ? new URLSearchParams(hash.replace(/^#/, ""))
        : null;

      // Always prefer invite/recovery tokens over any leftover logged-in session
      // (otherwise Super Admin email shows instead of the invited user)
      if (code || tokenHash || hashParams) {
        await clearLeftoverSession();

        if (code) {
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);
          if (!error && data.user?.id) {
            markReady(data.user.id, data.user.email);
            window.history.replaceState(null, "", "/set-password");
            return;
          }
          setFormError(error?.message || "Could not open invite session.");
          setCheckingSession(false);
          return;
        }

        if (tokenHash && otpType) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType as "invite" | "recovery" | "email",
          });
          if (!error && data.user?.id) {
            markReady(data.user.id, data.user.email);
            window.history.replaceState(null, "", "/set-password");
            return;
          }
          setFormError(error?.message || "Could not open invite session.");
          setCheckingSession(false);
          return;
        }

        if (hashParams) {
          const access_token = hashParams.get("access_token");
          const refresh_token = hashParams.get("refresh_token");
          if (access_token && refresh_token) {
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (!error && data.user?.id) {
              markReady(data.user.id, data.user.email);
              window.history.replaceState(null, "", "/set-password");
            } else {
              setFormError(error?.message || "Could not open invite session.");
            }
            setCheckingSession(false);
            return;
          }
        }
      }

      // After tokens are stripped from the URL, reuse only the invite session we just created
      const {
        data: { session },
      } = await supabase.auth.getSession();
      let expectedId: string | null = null;
      try {
        expectedId = sessionStorage.getItem("neev_set_password_ok");
      } catch {
        expectedId = null;
      }

      if (session?.user?.id && expectedId && session.user.id === expectedId) {
        markReady(session.user.id, session.user.email);
        return;
      }

      setFormError(
        "This invite link is invalid or expired. Open the invite link from your email (do not stay signed in as another admin in this browser).",
      );
      setCheckingSession(false);
    }

    void ensureSession();
  }, [searchParams]);

  const goToLogin = async (email?: string | null) => {
    setGoingToLogin(true);
    try {
      sessionStorage.removeItem("neev_set_password_ok");
    } catch {
      // ignore
    }
    await clearClientSession();
    const params = new URLSearchParams({ force_login: "1" });
    if (email) params.set("email", email);
    window.location.assign(`/login?${params.toString()}`);
  };

  const onSubmit = async (data: PasswordForm) => {
    setFormError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id || sessionUserId || undefined;

    // Guard: never set password for a different account than the one shown
    if (
      inviteEmail &&
      user?.email &&
      user.email.trim().toLowerCase() !== inviteEmail
    ) {
      setFormError(
        "Session email does not match this invite. Open the invite link from your email again.",
      );
      return;
    }

    if (user?.id) {
      const { error: clientUpdateError } = await supabase.auth.updateUser({
        password: data.password,
      });
      if (clientUpdateError) {
        // Admin API in setInvitedUserPassword is the fallback
      }
    }

    const result = await setInvitedUserPassword(data.password, userId);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    try {
      sessionStorage.removeItem("neev_set_password_ok");
    } catch {
      // ignore
    }
    await clearClientSession();
    setSuccessEmail(result.email);
  };

  if (checkingSession) {
    return (
      <AuthLayout title="Set Password" subtitle="Preparing your account…">
        <p className="text-center text-sm text-slate-500">Please wait…</p>
      </AuthLayout>
    );
  }

  if (successEmail) {
    return (
      <AuthLayout
        title="Password Set"
        subtitle="Your password is saved. Sign in with your email and new password."
      >
        <p className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-center text-xs text-emerald-800">
          Account ready for <strong>{successEmail}</strong>
        </p>
        <button
          type="button"
          disabled={goingToLogin}
          onClick={() => void goToLogin(successEmail)}
          className="btn-auth mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3.5 text-sm disabled:opacity-60"
        >
          {goingToLogin ? "Going to Sign In…" : "Continue to Sign In"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set Your Password"
      subtitle="Create a password for your admin account"
    >
      {!sessionReady ? (
        <div className="space-y-4">
          {formError && (
            <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600">
              {formError}
            </p>
          )}
          <Link
            href="/login?force_login=1"
            className="auth-link block text-center text-sm font-semibold"
          >
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {inviteEmail && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Email
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-900">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">{inviteEmail}</span>
              </p>
            </div>
          )}

          <AuthField
            id="password"
            label="New Password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            icon={Lock}
            error={errors.password?.message}
            registration={register("password")}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="cursor-pointer text-slate-400 transition-colors hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
          />
          <AuthField
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            placeholder="Re-enter password"
            icon={Lock}
            error={errors.confirmPassword?.message}
            registration={register("confirmPassword")}
          />

          {formError && (
            <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-auth mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3.5 text-sm disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Set Password"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Set Password" subtitle="Loading…">
          <p className="text-center text-sm text-slate-500">Please wait…</p>
        </AuthLayout>
      }
    >
      <SetPasswordForm />
    </Suspense>
  );
}
