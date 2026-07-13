"use client";

import { useState } from "react";
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
          {children}
        </main>
      </div>
    </div>
  );
}
