"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { customizationTabs } from "@/lib/nav-config";

export function CustomizationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-5 sm:space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Customization
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage your content modules
        </p>
      </motion.div>

      <div className="relative -mx-1 px-1">
        <div className="glass-card flex items-center gap-1 overflow-x-auto rounded-2xl p-1.5 scrollbar-none">
          {customizationTabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "relative shrink-0 cursor-pointer rounded-xl px-3.5 py-2 text-sm font-medium transition-colors duration-200 sm:px-4 sm:py-2.5",
                  isActive
                    ? "text-white"
                    : "text-slate-600 hover:bg-white/70 hover:text-slate-900",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="customization-tab"
                    className="absolute inset-0 rounded-xl bg-[#1a2744] shadow-md shadow-[#1a2744]/20"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
