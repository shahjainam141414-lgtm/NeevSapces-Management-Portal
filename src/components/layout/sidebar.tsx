"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
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
          "flex border-b border-[var(--border)]/80 px-3 py-4",
          collapsed
            ? "items-center justify-between px-4 py-5 lg:flex-col lg:items-center lg:gap-3 lg:justify-start"
            : "items-center justify-between px-4 py-5",
        )}
      >
        <Link
          href="/dashboard"
          onClick={onMobileClose}
          className={cn(
            "flex flex-col transition-opacity hover:opacity-80",
            collapsed ? "items-start lg:items-center" : "items-start",
          )}
        >
          <Image
            src="/logo.png"
            alt="Neev Spaces"
            width={200}
            height={111}
            className={cn(
              "h-10 w-auto object-contain sm:h-11",
              collapsed && "lg:hidden",
            )}
            priority
          />
          <Image
            src="/logo-mark.png"
            alt="Neev Spaces"
            width={96}
            height={96}
            className={cn(
              "hidden h-9 w-auto object-contain",
              collapsed && "lg:block",
            )}
            priority
          />
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggle}
            className="hidden cursor-pointer rounded-md p-1.5 text-[var(--muted)] transition duration-300 hover:bg-[var(--accent-soft)] hover:text-[var(--ink)] active:scale-95 lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onMobileClose}
            className="inline-flex cursor-pointer rounded-md p-1.5 text-[var(--muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--ink)] lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                "group relative flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium tracking-wide transition-colors duration-300",
                active
                  ? "text-white"
                  : "text-[var(--muted)] hover:text-[var(--ink)]",
                collapsed && "lg:justify-center lg:px-2",
              )}
              title={collapsed ? item.title : undefined}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-md bg-[var(--ink)] shadow-[0_8px_24px_rgba(20,32,51,0.22)]"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              )}
              {!active && (
                <span className="absolute inset-0 rounded-md bg-[var(--accent-soft)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              )}
              <Icon
                className={cn(
                  "relative z-10 h-[17px] w-[17px] shrink-0 transition duration-300 group-hover:scale-105",
                  active
                    ? "text-white"
                    : "text-[var(--muted-foreground)] group-hover:text-[var(--accent)]",
                )}
                strokeWidth={1.6}
              />
              <span className={cn("relative z-10", collapsed && "lg:hidden")}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "border-t border-[var(--border)]/80 px-4 py-3.5 text-[10px] font-medium tracking-wide text-[var(--muted-foreground)]",
          collapsed && "lg:px-2 lg:text-center",
        )}
      >
        <span className={cn(collapsed && "lg:hidden")}>© Neev Spaces · OS</span>
        <span className={cn("hidden", collapsed && "lg:inline")}>©</span>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[var(--ink-deep)]/45 backdrop-blur-sm lg:hidden"
            onClick={onMobileClose}
          />
        ) : null}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[min(18.5rem,88vw)] border-r border-[var(--border)] bg-white/95 shadow-[2px_0_32px_rgba(20,32,51,0.04)] backdrop-blur-xl transition-[width,transform] duration-300 ease-out lg:static lg:w-auto lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "lg:w-[76px]" : "lg:w-[248px]",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
