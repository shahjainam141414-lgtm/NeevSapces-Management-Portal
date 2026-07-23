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
          "flex border-b border-slate-100/80 px-3 py-4",
          collapsed
            ? "flex-col items-center gap-3"
            : "items-center justify-between px-4 py-5",
        )}
      >
        <Link
          href="/dashboard"
          onClick={onMobileClose}
          className={cn(
            "flex flex-col transition-opacity hover:opacity-80",
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
              <span className="mt-1.5 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
              <span className="h-[3px] w-[3px] rounded-full bg-[var(--accent)]" />
              Management Portal
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className="hidden cursor-pointer rounded-lg p-1.5 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600 active:scale-90 lg:inline-flex"
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
                "group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                active ? "text-white" : "text-slate-500 hover:text-slate-800",
                collapsed && "justify-center px-2",
              )}
              title={collapsed ? item.title : undefined}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-xl bg-[var(--accent)] shadow-[0_6px_18px_rgba(47,111,237,0.32)]"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
              {!active && (
                <span className="absolute inset-0 rounded-xl bg-slate-50 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              )}
              <Icon
                className={cn(
                  "relative z-10 h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110",
                  active ? "text-white" : "text-slate-400 group-hover:text-slate-600",
                )}
              />
              {!collapsed && <span className="relative z-10">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "border-t border-slate-100/80 px-4 py-3.5 text-[10px] font-medium text-slate-400",
          collapsed && "px-2 text-center",
        )}
      >
        {collapsed ? "©" : "© Neev Spaces · Admin"}
      </div>
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#0b1220]/40 backdrop-blur-sm lg:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 border-r border-[var(--border)] bg-white shadow-[2px_0_24px_rgba(20,32,51,0.05)] transition-[width,transform] duration-300 ease-out lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "lg:w-[76px]" : "lg:w-[260px]",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
