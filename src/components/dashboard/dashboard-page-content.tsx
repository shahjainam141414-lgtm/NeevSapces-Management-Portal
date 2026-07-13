"use client";

import { motion } from "framer-motion";
import {
  Building2,
  FolderKanban,
  MapPin,
  TrendingUp,
  Users,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
  {
    title: "Total Projects",
    value: "128",
    change: "+12%",
    icon: FolderKanban,
  },
  {
    title: "Total Areas",
    value: "24",
    change: "+3",
    icon: MapPin,
  },
  {
    title: "Total Builders",
    value: "18",
    change: "+2",
    icon: Building2,
  },
  {
    title: "Active Listings",
    value: "342",
    change: "+8%",
    icon: TrendingUp,
  },
];

const recentLeads = [
  { name: "Amit Patel", project: "Shilp One", time: "2 min ago" },
  { name: "Sneha Desai", project: "Gala Empire", time: "15 min ago" },
  { name: "Vikram Shah", project: "Sun Sky Park", time: "1 hr ago" },
];

export function DashboardPageContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Overview
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Welcome back, Parth. Your portfolio at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-[#1a2744]/5">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{stat.title}</p>
                      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-xs font-medium text-emerald-600">
                        {stat.change} this month
                      </p>
                    </div>
                    <div className="rounded-xl bg-gradient-to-br from-[#1a2744]/10 to-[#d4a853]/10 p-3 text-[#1a2744]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "New project 'Goyal Riviera' added to Science City",
              "Builder 'Prestige Group' profile updated",
              "12 new leads received from SG Highway area",
              "Testimonial approved for homepage",
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-xl border border-slate-100 p-4"
              >
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#8B6D2D]" />
                <div>
                  <p className="text-sm text-slate-700">{activity}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {index + 1} hour{index === 0 ? "" : "s"} ago
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest Leads</CardTitle>
            <Badge variant="secondary">{recentLeads.length} new</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentLeads.map((lead) => (
              <div
                key={lead.name}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a2744] text-xs font-semibold text-white">
                    {lead.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{lead.name}</p>
                    <p className="text-xs text-slate-500">{lead.project}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">{lead.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Users</p>
              <p className="text-2xl font-bold text-slate-900">8</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Leads This Week</p>
              <p className="text-2xl font-bold text-slate-900">47</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
