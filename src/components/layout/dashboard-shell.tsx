"use client";

import { useEffect, useState } from "react";
import Lenis from "lenis";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/layout/command-palette";
import type { AdminProfile } from "@/lib/admin-profiles";
import { shouldPreventLenis } from "@/lib/nested-scroll";

type DashboardShellProps = {
  children: React.ReactNode;
  user: AdminProfile | null;
};

export function DashboardShell({ children, user }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      touchMultiplier: 1.4,
      prevent: (node) =>
        node instanceof HTMLElement && shouldPreventLenis(node),
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    document.documentElement.classList.add("lenis");

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      document.documentElement.classList.remove("lenis");
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <div className="dashboard-bg min-h-dvh min-w-0">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        className={
          collapsed
            ? "flex min-h-dvh min-w-0 flex-col lg:pl-[76px]"
            : "flex min-h-dvh min-w-0 flex-col lg:pl-[248px]"
        }
      >
        <Header onMenuClick={() => setMobileOpen(true)} user={user} />
        <main className="min-w-0 flex-1 overflow-x-clip px-3 py-3 sm:px-5 sm:py-5 lg:px-8 lg:py-8">
          <div className="mx-auto w-full min-w-0 max-w-[1440px]">{children}</div>
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}
