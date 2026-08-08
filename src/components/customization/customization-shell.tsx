"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { customizationTabs } from "@/lib/nav-config";
import { PageHeader } from "@/components/ui/page-header";
import { ScrollRegion } from "@/components/ui/scroll-region";

export function CustomizationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-4 sm:space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PageHeader
          title="Customization"
          description="Areas, properties, banners, builders, amenities, and more"
        />
      </motion.div>

      <ScrollRegion fade className="glass-card rounded-2xl p-1.5">
        <div className="flex w-max min-w-full items-center gap-1">
          {customizationTabs.map((tab) => {
            const isActive =
              pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "relative shrink-0 cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200 sm:px-4 sm:py-2.5",
                  isActive
                    ? "text-white"
                    : "text-slate-600 hover:bg-white/70 hover:text-slate-900",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="customization-tab"
                    className="absolute inset-0 rounded-xl bg-[#16233f] shadow-[0_6px_18px_rgba(22,35,63,0.28),inset_0_1px_0_rgba(255,255,255,0.16)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 whitespace-nowrap">
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </ScrollRegion>

      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="min-w-0"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
