"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, ChevronRight, Home, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentAdminProfile } from "@/app/actions/auth";
import type { AdminProfile } from "@/lib/admin-profiles";
import { getInitials } from "@/lib/utils";

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
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

  const displayName = user?.name ?? (loading ? "…" : "Admin");
  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          My Profile
        </h2>
        <nav className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 transition-colors hover:text-[#1a2744]"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-slate-700">My Profile</span>
        </nav>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-8 sm:px-8">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
              <div className="relative">
                <Avatar className="h-24 w-24 shadow-lg ring-4 ring-white">
                  {user?.photo_url ? (
                    <AvatarImage src={user.photo_url} alt={displayName} />
                  ) : null}
                  <AvatarFallback className="bg-[#1a2744] text-2xl font-semibold text-white">
                    {getInitials(displayName === "…" ? "NA" : displayName)}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#1a2744] text-white shadow-md transition-transform hover:scale-105"
                  aria-label="Edit profile photo"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-2xl font-bold text-slate-900">
                  {displayName}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {user?.role ?? "Super Admin"}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <div className="mb-6 flex items-center gap-2">
              <UserRound className="h-4 w-4 text-[#1a2744]" />
              <h4 className="text-base font-semibold text-slate-900">
                Profile Details
              </h4>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <ProfileField label="Email Id" value={user?.email ?? "—"} />
              <ProfileField
                label="Mobile Number"
                value={user?.phone ?? "—"}
              />
              <ProfileField
                label="Role"
                value={user?.role ?? "Super Admin"}
              />
              <ProfileField label="Joining Date" value={joined} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
