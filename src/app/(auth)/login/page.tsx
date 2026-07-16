"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail, UserX } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthField } from "@/components/auth/auth-field";
import { createClient } from "@/lib/supabase/client";
import { getAppUrl } from "@/lib/app-url";
import { isAllowlistedAdmin } from "@/app/actions/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

type AccessDialog = {
  title: string;
  description: string;
} | null;

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M6.6 14.3l-.7.5-2.4 1.9C5.1 19.5 8.3 21.6 12 21.6c2.4 0 4.4-.8 5.9-2.1l-3.1-2.4c-.8.6-1.9.9-2.8.9-2.2 0-4-1.5-4.7-3.5z"
      />
      <path
        fill="#4A90E2"
        d="M3.5 7.3C2.7 8.9 2.2 10.6 2.2 12.5s.5 3.6 1.3 5.2l3.1-2.4c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8L3.5 7.3z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.4c1.3 0 2.5.5 3.4 1.3l2.6-2.6C16.4 2.6 14.4 1.8 12 1.8 8.3 1.8 5.1 3.9 3.5 7.3l3.1 2.4C7.9 6.9 9.8 5.4 12 5.4z"
      />
    </svg>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const callbackError = searchParams.get("error");
  const prefillEmail = searchParams.get("email") ?? "";
  const forceLogin = searchParams.get("force_login") === "1";

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [accessDialog, setAccessDialog] = useState<AccessDialog>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(
    forceLogin
      ? "Password saved. Sign in with your email and the password you just created."
      : null,
  );
  const [handledCallbackError, setHandledCallbackError] = useState<
    string | null
  >(null);

  const callbackDialog: AccessDialog =
    callbackError === "not_invited"
      ? {
          title: "User not found",
          description:
            "This account is not registered in the admin panel. Please contact your administrator to get access.",
        }
      : callbackError === "auth_callback"
        ? {
            title: "Sign-in failed",
            description:
              "Something went wrong during sign-in. Please try again.",
          }
        : null;

  const urlAccessDialog =
    callbackError && handledCallbackError !== callbackError
      ? callbackDialog
      : null;

  const shownAccessDialog = accessDialog ?? urlAccessDialog;

  const clearAccessDialog = () => {
    setAccessDialog(null);
    if (callbackError) {
      setHandledCallbackError(callbackError);
      router.replace("/login", { scroll: false });
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: prefillEmail,
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setFormError(null);
    setInfoMessage(null);
    const supabase = createClient();
    // Sign out any leftover invite session before password login
    await supabase.auth.signOut({ scope: "global" }).catch(() => undefined);

    const email = data.email.trim().toLowerCase();
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password: data.password,
    });

    if (error) {
      setAccessDialog({
        title: "Sign-in failed",
        description:
          error.message.toLowerCase().includes("invalid")
            ? "Invalid email or password. Use the exact password you set on the invite page, or reset via Forgot password."
            : error.message,
      });
      return;
    }

    const userId = authData.user?.id;
    const userEmail = (authData.user?.email ?? email).toLowerCase();

    if (!userId) {
      setAccessDialog({
        title: "Sign-in failed",
        description: "Could not verify your account. Please try again.",
      });
      return;
    }

    const allowed = await isAllowlistedAdmin(userId, userEmail);
    if (!allowed) {
      await supabase.auth.signOut();
      setAccessDialog({
        title: "User not found",
        description:
          "This account is not registered in the admin panel. Please contact your administrator to get access.",
      });
      return;
    }

    window.location.assign(next.startsWith("/") ? next : "/dashboard");
  };

  const signInWithGoogle = async () => {
    setFormError(null);
    setGoogleLoading(true);
    const supabase = createClient();
    const appUrl = getAppUrl();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setAccessDialog({
        title: "Sign-in failed",
        description: error.message,
      });
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <AuthLayout
        title="Welcome Back"
        subtitle="Sign in to access your properties"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <AuthField
            id="email"
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            icon={Mail}
            error={errors.email?.message}
            registration={register("email")}
          />

          <AuthField
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            icon={Lock}
            error={errors.password?.message}
            registration={register("password")}
            rightElement={
              <div className="flex items-center gap-3">
                <Link
                  href="/forgot-password"
                  className="auth-link text-[10px] font-semibold uppercase tracking-[0.1em]"
                >
                  Forgot?
                </Link>
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
              </div>
            }
          />

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 accent-[#1a2744]"
              {...register("remember")}
            />
            <span className="text-sm text-slate-500">Keep me signed in</span>
          </label>

          {infoMessage && (
            <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
              {infoMessage}
            </p>
          )}

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
            {isSubmitting ? "Signing in..." : "Sign In"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200/80" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="bg-white/80 px-3 text-slate-400">or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          disabled={googleLoading}
          className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          <GoogleIcon className="h-5 w-5" />
          {googleLoading ? "Redirecting…" : "Continue with Google"}
        </button>

        <p className="mt-6 text-center text-sm text-slate-500">
          New associate?{" "}
          <span className="font-semibold text-slate-700">
            Contact Administration
          </span>
        </p>
      </AuthLayout>

      <Dialog
        open={!!shownAccessDialog}
        onOpenChange={(open) => {
          if (!open) clearAccessDialog();
        }}
      >
        <DialogContent className="max-w-sm text-center sm:text-left">
          <DialogHeader className="items-center sm:items-start">
            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-[#1a2744]">
              <UserX className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl">
              {shownAccessDialog?.title ?? "User not found"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-slate-500">
              {shownAccessDialog?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center sm:justify-end">
            <Button
              type="button"
              className="cursor-pointer"
              onClick={clearAccessDialog}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Welcome Back" subtitle="Loading…">
          <p className="text-center text-sm text-slate-500">Please wait…</p>
        </AuthLayout>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
