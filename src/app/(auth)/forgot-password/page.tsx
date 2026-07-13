import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthField } from "@/components/auth/auth-field";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email and we'll send you a reset link"
    >
      <form className="space-y-5">
        <AuthField
          id="email"
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          icon={Mail}
        />
        <button
          type="submit"
          className="btn-auth flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm"
        >
          Send Reset Link
          <ArrowRight className="h-4 w-4" />
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
