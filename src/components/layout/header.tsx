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

function usePageTitle(pathname: string) {
  if (pathname.startsWith("/dashboard")) return "Command Center";
  if (pathname.startsWith("/users")) return "Team";
  if (pathname.startsWith("/properties")) return "Properties";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/profile")) return "My Profile";
  if (pathname.startsWith("/customization")) {
    const tab = customizationTabs.find((t) => pathname.startsWith(t.href));
    return tab ? tab.label : "Customization";
  }
  return "";
}

export function Header({ onMenuClick, user }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const pageTitle = usePageTitle(pathname);
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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border)]/80 bg-white/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex cursor-pointer rounded-md p-2 text-[var(--muted)] transition hover:bg-[var(--accent-soft)] lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        {pageTitle ? (
          <div className="hidden lg:block">
            <p className="type-caption text-[var(--accent)]">Neev Spaces OS</p>
            <p className="font-display type-title text-sm text-[var(--ink)]">
              {pageTitle}
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={openCommand}
          className="hidden items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)]/35 hover:text-[var(--ink)] md:inline-flex"
        >
          <Search className="h-3.5 w-3.5" strokeWidth={1.6} />
          <span>Search</span>
          <kbd className="ml-2 rounded border border-[var(--border)] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
            ⌘K
          </kbd>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex cursor-pointer items-center gap-2.5 rounded-md border border-[var(--border)] bg-white px-2.5 py-1.5 shadow-[var(--shadow-soft)] transition duration-300 hover:border-[var(--accent)]/30 sm:gap-3 sm:px-3"
            >
              <Avatar className="h-8 w-8">
                {user?.photo_url ? (
                  <AvatarImage src={user.photo_url} alt={displayName} />
                ) : null}
                <AvatarFallback className="bg-[var(--ink)] text-[11px] font-semibold text-white">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-[var(--ink)]">
                  {displayName}
                </p>
                <p className="text-[11px] text-[var(--muted)]">{displayRole}</p>
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
    </header>
  );
}
