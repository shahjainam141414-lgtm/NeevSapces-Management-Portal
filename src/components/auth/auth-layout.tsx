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
          className="relative mb-8 text-center sm:mb-10"
        >
          {/* Soft dark wash so the divider stays visible over light parts of the photo */}
          <div
            className="pointer-events-none absolute left-1/2 top-[42%] h-24 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/35 blur-2xl"
            aria-hidden
          />
          <div className="relative">
            <Image
              src="/logo-white.png"
              alt="Neev Spaces"
              width={252}
              height={140}
              className="mx-auto h-14 w-auto object-contain sm:h-16"
              priority
            />
            {/*
              Soft fade divider (not a solid bar).
              Uses 2px + GPU layer — a true 1px hairline often disappears at
              some zoom/DPR values until DevTools resizes the viewport.
            */}
            <div
              className="mx-auto mt-5 h-0.5 w-16 rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent [transform:translateZ(0)]"
              aria-hidden
            />
            <p className="auth-display mt-4 text-base font-medium uppercase tracking-[0.45em] text-white/85 sm:text-lg sm:tracking-[0.5em]">
              Management Portal
            </p>
          </div>
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
