"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import type { AdminProfile } from "@/lib/admin-profiles";

type HeaderProps = {
  onMenuClick: () => void;
  user: AdminProfile | null;
};

export function Header({ onMenuClick, user }: HeaderProps) {
  const router = useRouter();
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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-100 bg-white/90 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-50 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-100 bg-white px-2.5 py-1.5 shadow-sm transition-all hover:border-slate-200 hover:shadow-md sm:gap-3 sm:px-3"
          >
            <Avatar className="h-8 w-8">
              {user?.photo_url ? (
                <AvatarImage src={user.photo_url} alt={displayName} />
              ) : null}
              <AvatarFallback className="bg-[#1a2744] text-[11px] font-semibold text-white">
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
            <p className="text-xs text-slate-500">{displayEmail}</p>
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
