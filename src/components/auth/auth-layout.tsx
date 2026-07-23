"use client";

import Image from "next/image";
import { motion } from "framer-motion";

type AuthLayoutProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

export function AuthLayout({
  children,
  title = "Welcome Back",
  subtitle = "Sign in to access your properties",
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--ink)]">
      <Image
        src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=75&w=1600&auto=format&fit=crop"
        alt="Luxury property"
        fill
        className="object-cover opacity-70"
        sizes="100vw"
        priority={false}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--ink)]/75 via-[var(--ink)]/55 to-[var(--ink-deep)]/80" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(47,111,237,0.22),transparent_60%)]" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-10 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 text-center sm:mb-10"
        >
          <Image
            src="/logo.png"
            alt="Neev"
            width={220}
            height={56}
            className="mx-auto h-12 w-auto object-contain drop-shadow-[0_4px_24px_rgba(255,255,255,0.2)] sm:h-14"
            priority
          />
          <p className="auth-display mt-5 text-base font-medium uppercase tracking-[0.45em] text-white/85 sm:text-lg sm:tracking-[0.5em]">
            Management Portal
          </p>
          <div className="mx-auto mt-3 h-px w-14 bg-gradient-to-r from-transparent via-[var(--accent-light)] to-transparent" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="relative w-full max-w-[440px]"
        >
          <div className="auth-glass-card rounded-3xl p-7 sm:p-9">
            <div className="mb-6 text-center">
              <h1 className="font-display text-2xl font-bold text-[var(--ink)]">
                {title}
              </h1>
              <p className="mt-2 text-sm text-[var(--muted)]">{subtitle}</p>
            </div>
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
