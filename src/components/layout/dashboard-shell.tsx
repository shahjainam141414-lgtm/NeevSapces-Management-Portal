"use client";

import { useEffect, useState } from "react";
import Lenis from "lenis";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/layout/command-palette";
import type { AdminProfile } from "@/lib/admin-profiles";

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

  return (
    <div className="dashboard-bg flex min-h-screen">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setMobileOpen(true)} user={user} />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}
