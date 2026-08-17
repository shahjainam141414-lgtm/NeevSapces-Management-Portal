"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Building2,
  Inbox,
  LayoutDashboard,
  MapPin,
  Plus,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";

const ACTIONS = [
  {
    group: "Navigate",
    items: [
      { label: "Command Center", href: "/dashboard", icon: LayoutDashboard },
      { label: "Lead inbox", href: "/leads", icon: Inbox },
      { label: "Properties", href: "/customization/properties", icon: Building2 },
      { label: "Areas", href: "/customization/areas", icon: MapPin },
      { label: "Builders", href: "/customization/builders", icon: Sparkles },
      {
        label: "Customization",
        href: "/customization/areas",
        icon: SlidersHorizontal,
      },
      { label: "Team", href: "/users", icon: Users },
      { label: "Settings (Details)", href: "/settings", icon: Settings },
    ],
  },
  {
    group: "Create",
    items: [
      {
        label: "New Property",
        href: "/customization/properties/new",
        icon: Plus,
        hint: "N",
      },
    ],
  },
] as const;

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
          return;
        }
        e.preventDefault();
        router.push("/customization/properties/new");
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("neev:open-command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("neev:open-command", onOpen);
    };
  }, [router, toggle]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-[var(--ink-deep)]/45 px-4 pt-[18vh] backdrop-blur-md">
      <button
        type="button"
        aria-label="Close command palette"
        className="absolute inset-0"
        onClick={() => setOpen(false)}
      />
      <Command
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-[var(--shadow-lift)]"
        label="Global search"
      >
        <div className="border-b border-[var(--border)] px-4 py-3">
          <Command.Input
            placeholder="Search properties, areas, builders, pages…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
            autoFocus
          />
        </div>
        <Command.List
          data-lenis-prevent
          className="scrollbar-thin max-h-80 overflow-y-auto overscroll-contain p-2"
        >
          <Command.Empty className="px-3 py-8 text-center text-sm text-[var(--muted)]">
            No matches found.
          </Command.Empty>
          {ACTIONS.map((group) => (
            <Command.Group
              key={group.group}
              heading={group.group}
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.16em] [&_[cmdk-group-heading]]:text-[var(--muted)]"
            >
              {group.items.map((item) => (
                <Command.Item
                  key={item.href + item.label}
                  value={item.label}
                  onSelect={() => {
                    setOpen(false);
                    router.push(item.href);
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[var(--ink)] aria-selected:bg-[var(--accent-soft)]"
                >
                  <item.icon
                    className="h-4 w-4 text-[var(--accent)]"
                    strokeWidth={1.6}
                  />
                  <span className="flex-1 font-medium">{item.label}</span>
                  {"hint" in item && item.hint ? (
                    <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
                      {item.hint}
                    </kbd>
                  ) : null}
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>
        <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2 text-[10px] text-[var(--muted-foreground)]">
          <span>Navigate with ↑ ↓ · Enter to open</span>
          <span>Esc to close</span>
        </div>
      </Command>
    </div>
  );
}
