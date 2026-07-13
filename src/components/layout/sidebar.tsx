"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { mainNav } from "@/lib/nav-config";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href.startsWith("/customization")) {
      return pathname.startsWith("/customization");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex border-b border-slate-100 px-3 py-4",
          collapsed
            ? "flex-col items-center gap-3"
            : "items-center justify-between px-4 py-5",
        )}
      >
        <Link
          href="/dashboard"
          onClick={onMobileClose}
          className={cn(
            "flex flex-col",
            collapsed ? "items-center" : "items-start",
          )}
        >
          <Image
            src="/logo.png"
            alt="Neev"
            width={collapsed ? 40 : 120}
            height={40}
            className={cn(
              "w-auto object-contain",
              collapsed ? "h-8" : "h-9",
            )}
            priority
          />
          {!collapsed && (
            <span className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Management Portal
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className="hidden rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 lg:inline-flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                "group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-[#1a2744] text-white shadow-md shadow-[#1a2744]/15"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                collapsed && "justify-center px-2",
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  active
                    ? "text-white"
                    : "text-slate-400 group-hover:text-slate-600",
                )}
              />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 border-r border-slate-100 bg-white shadow-[2px_0_20px_rgba(15,23,42,0.04)] transition-all duration-300 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "lg:w-[72px]" : "lg:w-[260px]",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
