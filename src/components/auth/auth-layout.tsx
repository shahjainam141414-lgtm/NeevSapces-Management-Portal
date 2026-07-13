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
    <div className="relative min-h-screen overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop"
        alt="Luxury property"
        fill
        priority
        className="object-cover scale-105"
        sizes="100vw"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#1a2744]/60 via-[#1a2744]/45 to-[#0a0f1a]/70" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,130,210,0.15),transparent_60%)]" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-10 sm:px-6">
        {/* Logo + tagline — outside the card */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
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
        </motion.div>

        {/* Glass card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="auth-glass-card w-full max-w-[440px] rounded-3xl px-7 py-8 sm:px-9 sm:py-10"
        >
          <div className="mb-7 text-center">
            <h1 className="auth-display text-[1.65rem] font-semibold leading-tight text-slate-900 sm:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {subtitle}
              </p>
            )}
          </div>

          {children}
        </motion.div>
      </div>
    </div>
  );
}
