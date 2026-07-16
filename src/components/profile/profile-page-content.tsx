"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  ChevronRight,
  Home,
  IdCard,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentAdminProfile } from "@/app/actions/auth";
import type { AdminProfile } from "@/lib/admin-profiles";
import { getInitials } from "@/lib/utils";

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition-colors duration-200 hover:border-slate-200 hover:bg-slate-50">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#16233f] shadow-[0_1px_2px_rgba(16,25,46,0.04)] ring-1 ring-slate-100">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col items-center gap-5 border-b border-slate-100 bg-slate-50/60 px-6 py-10 sm:flex-row sm:px-8">
          <Skeleton className="h-24 w-24 shrink-0 rounded-full" />
          <div className="w-full space-y-2.5 sm:w-48">
            <Skeleton className="mx-auto h-6 w-40 sm:mx-0" />
            <Skeleton className="mx-auto h-4 w-24 sm:mx-0" />
          </div>
        </div>
        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <Skeleton className="mb-5 h-5 w-32" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfilePageContent() {
  const [user, setUser] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getCurrentAdminProfile().then((profile) => {
      setUser(profile);
      setLoading(false);
    });
  }, []);

  const displayName = user?.name ?? "Admin";
  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })
    : "—";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="My Profile"
        description={
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 transition-colors hover:text-[#16233f]"
            >
              <Home className="h-3.5 w-3.5" />
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-slate-700">My Profile</span>
          </nav>
        }
      />

      {loading ? (
        <ProfileSkeleton />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative overflow-hidden bg-gradient-to-br from-[#16233f] via-[#1f3157] to-[#0f1a30] px-6 py-10 sm:px-8">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -left-14 bottom-0 h-32 w-32 rounded-full bg-white/[0.06] blur-3xl"
                />
                <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-center">
                  <div className="relative">
                    <Avatar className="h-24 w-24 shadow-xl ring-4 ring-white/80">
                      {user?.photo_url ? (
                        <AvatarImage src={user.photo_url} alt={displayName} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-[#1f3157] to-[#16233f] text-2xl font-semibold text-white">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-white text-[#16233f] shadow-md transition-transform hover:scale-105"
                      aria-label="Edit profile photo"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="font-display text-2xl font-semibold text-white">
                      {displayName}
                    </h3>
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
                      {user?.role ?? "Super Admin"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6 sm:px-8 sm:py-8">
                <div className="mb-5 flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-[#16233f]" />
                  <h4 className="font-display text-base font-semibold text-slate-900">
                    Profile Details
                  </h4>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ProfileField icon={Mail} label="Email Id" value={user?.email ?? "—"} />
                  <ProfileField
                    icon={Phone}
                    label="Mobile Number"
                    value={user?.phone ?? "—"}
                  />
                  <ProfileField
                    icon={ShieldCheck}
                    label="Role"
                    value={user?.role ?? "Super Admin"}
                  />
                  <ProfileField icon={IdCard} label="Joining Date" value={joined} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
