"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Building2,
  FolderKanban,
  MapPin,
  TrendingUp,
  Users,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { TiltCard } from "@/components/ui/tilt-card";

const stats = [
  {
    title: "Total Properties",
    value: "128",
    change: "+12%",
    icon: FolderKanban,
    trend: [8, 10, 9, 13, 12, 15, 14, 18, 17, 20],
  },
  {
    title: "Total Areas",
    value: "24",
    change: "+3",
    icon: MapPin,
    trend: [15, 16, 16, 17, 18, 18, 19, 20, 21, 24],
  },
  {
    title: "Total Builders",
    value: "18",
    change: "+2",
    icon: Building2,
    trend: [12, 12, 13, 13, 14, 15, 15, 16, 17, 18],
  },
  {
    title: "Active Listings",
    value: "342",
    change: "+8%",
    icon: TrendingUp,
    trend: [260, 270, 265, 290, 300, 295, 310, 320, 330, 342],
  },
];

function Sparkline({
  points,
  color = "#16233f",
}: {
  points: number[];
  color?: string;
}) {
  const width = 72;
  const height = 26;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const path = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(
          height - ((p - min) / range) * height
        ).toFixed(1)}`,
    )
    .join(" ");
  const areaPath = `${path} L${width},${height} L0,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden
    >
      <motion.path
        d={areaPath}
        fill={color}
        fillOpacity={0.06}
        stroke="none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      />
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
      />
    </svg>
  );
}

const recentLeads = [
  { name: "Amit Patel", project: "Shilp One", time: "2 min ago" },
  { name: "Sneha Desai", project: "Gala Empire", time: "15 min ago" },
  { name: "Vikram Shah", project: "Sun Sky Park", time: "1 hr ago" },
];

export function DashboardPageContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Welcome back, Parth"
        description="Here's what's happening across your portfolio today."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <TiltCard maxTilt={5}>
                <Card className="glass-card-hover overflow-hidden">
                  <CardContent className="relative overflow-hidden p-6">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-[#16233f]/8 to-transparent"
                    />
                    <div className="relative flex items-start justify-between">
                      <div>
                        <p className="text-sm text-slate-500">{stat.title}</p>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                          {stat.value}
                        </p>
                        <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <ArrowUpRight className="h-3 w-3" />
                          {stat.change} this month
                        </p>
                      </div>
                      <div className="rounded-xl bg-gradient-to-br from-[#16233f]/12 to-[#1f3157]/6 p-3 text-[#16233f] shadow-[0_1px_2px_rgba(16,25,46,0.04)]">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="relative mt-4 flex items-end justify-end border-t border-slate-100 pt-3">
                      <Sparkline points={stat.trend} />
                    </div>
                  </CardContent>
                </Card>
              </TiltCard>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "New project 'Goyal Riviera' added to Science City",
                "Builder 'Prestige Group' profile updated",
                "12 new leads received from SG Highway area",
                "Testimonial approved for homepage",
              ].map((activity, index) => (
                <div
                  key={index}
                  className="group flex items-start gap-3 rounded-xl border border-slate-100 p-4 transition-all duration-200 hover:border-slate-200 hover:bg-slate-50/60"
                >
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#16233f] transition-transform duration-200 group-hover:scale-125" />
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Latest Leads</CardTitle>
              <Badge variant="premium">{recentLeads.length} new</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentLeads.map((lead) => (
                <div
                  key={lead.name}
                  className="flex items-center justify-between rounded-xl bg-slate-50/80 p-3 transition-colors duration-200 hover:bg-slate-100/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1f3157] to-[#16233f] text-xs font-semibold text-white">
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
        </motion.div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="glass-card-hover">
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
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="glass-card-hover">
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
        </motion.div>
      </div>
    </div>
  );
}
