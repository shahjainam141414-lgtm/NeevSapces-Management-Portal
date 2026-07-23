"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, UserRound } from "lucide-react";
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
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/users")) return "Users";
  if (pathname.startsWith("/properties")) return "Properties";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/profile")) return "My Profile";
  if (pathname.startsWith("/customization")) {
    const tab = customizationTabs.find((t) => pathname.startsWith(t.href));
    return tab ? `Customization · ${tab.label}` : "Customization";
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

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border)] bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-50 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        {pageTitle && (
          <p className="hidden text-sm font-semibold tracking-tight text-slate-700 lg:block">
            {pageTitle}
          </p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-100 bg-white px-2.5 py-1.5 shadow-sm transition-all duration-200 hover:border-slate-200 hover:shadow-md sm:gap-3 sm:px-3"
          >
            <Avatar className="h-8 w-8">
              {user?.photo_url ? (
                <AvatarImage src={user.photo_url} alt={displayName} />
              ) : null}
              <AvatarFallback className="bg-[var(--accent)] text-[11px] font-semibold text-white">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {displayName}
              </p>
              <p className="text-[11px] text-slate-500">{displayRole}</p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-3 py-2">
            <p className="text-sm font-semibold text-slate-900">{displayName}</p>
            <p className="truncate text-xs text-slate-500">{displayEmail}</p>
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
    </header>
  );
}
