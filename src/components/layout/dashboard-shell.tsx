"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import type { AdminProfile } from "@/lib/admin-profiles";

type DashboardShellProps = {
  children: React.ReactNode;
  user: AdminProfile | null;
};

export function DashboardShell({ children, user }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Key the page-transition by top-level section only (e.g. "customization",
  // "properties"), not the full pathname. Keying on the full path would force
  // React to remount everything below — including nested layouts like
  // CustomizationShell's tab bar — on every sub-tab click, making a simple
  // tab switch look and feel like a full page reload. Section-level keying
  // keeps the persistent chrome (tab bar, etc.) mounted across sub-navigation
  // while still giving a nice transition when moving between major sections.
  const sectionKey = pathname.split("/")[1] || "root";

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
          <AnimatePresence mode="wait">
            <motion.div
              key={sectionKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
