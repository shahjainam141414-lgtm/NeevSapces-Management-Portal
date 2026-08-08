"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  Menu,
  Search,
  UserRound,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { customizationTabs } from "@/lib/nav-config";
import type { AdminProfile } from "@/lib/admin-profiles";

type HeaderProps = {
  onMenuClick: () => void;
  user: AdminProfile | null;
};

function usePageMeta(pathname: string) {
  if (pathname.startsWith("/dashboard")) {
    return { eyebrow: "Operations", title: "Command Center" };
  }
  if (pathname.startsWith("/users")) {
    return { eyebrow: "People", title: "Team" };
  }
  if (pathname.startsWith("/leads")) {
    return { eyebrow: "Pipeline", title: "Lead Inbox" };
  }
  if (pathname.startsWith("/properties")) {
    return { eyebrow: "Catalog", title: "Properties" };
  }
  if (pathname.startsWith("/settings")) {
    return { eyebrow: "System", title: "Settings" };
  }
  if (pathname.startsWith("/profile")) {
    return { eyebrow: "Account", title: "My Profile" };
  }
  if (pathname.startsWith("/customization")) {
    const tab = customizationTabs.find((t) => pathname.startsWith(t.href));
    return {
      eyebrow: "Studio",
      title: tab ? tab.label : "Customization",
    };
  }
  return { eyebrow: "Neev Spaces", title: "" };
}

export function Header({ onMenuClick, user }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { eyebrow, title } = usePageMeta(pathname);
  const displayName = user?.name ?? "Admin";
  const displayRole = user?.role ?? "Super Admin";
  const displayEmail = user?.email ?? "";

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const openCommand = () => {
    window.dispatchEvent(new CustomEvent("neev:open-command"));
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)]/70 bg-white/75 backdrop-blur-2xl">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/50 to-transparent"
        aria-hidden
      />
      <div className="relative flex h-14 items-center justify-between gap-3 px-3 sm:h-[4.25rem] sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex shrink-0 cursor-pointer rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--ink)] lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {title ? (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="hidden h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_0_3px_rgba(62,95,138,0.18)] sm:inline-block" />
                <p className="type-caption truncate text-[var(--accent)]">
                  {eyebrow}
                </p>
              </div>
              <h1 className="font-display mt-0.5 truncate text-base tracking-tight text-[var(--ink)] sm:text-xl">
                {title}
              </h1>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={openCommand}
            className="inline-flex cursor-pointer rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--ink)] md:hidden"
            aria-label="Search"
          >
            <Search className="h-5 w-5" strokeWidth={1.6} />
          </button>
          <button
            type="button"
            onClick={openCommand}
            className="group relative hidden items-center gap-2.5 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--muted)] shadow-[var(--shadow-soft)] transition duration-300 hover:border-[var(--accent)]/40 hover:text-[var(--ink)] md:inline-flex"
          >
            <span
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[var(--accent-soft)]/0 via-[var(--accent-soft)]/70 to-[var(--accent-soft)]/0 opacity-0 transition duration-500 group-hover:opacity-100"
              aria-hidden
            />
            <Search className="relative h-3.5 w-3.5" strokeWidth={1.6} />
            <span className="relative">Search anything</span>
            <kbd className="relative ml-1 rounded-md border border-[var(--border)] bg-white px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--muted-foreground)]">
              ⌘K
            </kbd>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--border)] bg-white py-1.5 pl-1.5 pr-2.5 shadow-[var(--shadow-soft)] transition duration-300 hover:border-[var(--accent)]/35 hover:shadow-[var(--shadow-lift)] sm:gap-3 sm:pr-3"
              >
                <Avatar className="h-9 w-9 ring-2 ring-[var(--accent-soft)]">
                  {user?.photo_url ? (
                    <AvatarImage src={user.photo_url} alt={displayName} />
                  ) : null}
                  <AvatarFallback className="bg-[var(--ink)] text-[11px] font-semibold text-white">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold leading-tight text-[var(--ink)]">
                    {displayName}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                    {displayRole}
                  </p>
                </div>
                <ChevronDown className="hidden h-3.5 w-3.5 text-[var(--muted-foreground)] sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-[var(--ink)]">
                  {displayName}
                </p>
                <p className="truncate text-xs text-[var(--muted)]">
                  {displayEmail}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/profile" className="flex w-full items-center">
                  <UserRound className="mr-2 h-4 w-4" />
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                destructive
                onSelect={(e) => {
                  e.preventDefault();
                  void handleSignOut();
                }}
              >
                <span className="flex w-full cursor-pointer items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
