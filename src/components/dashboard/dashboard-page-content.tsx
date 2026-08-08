"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  FileEdit,
  Inbox,
  Layers3,
  MapPin,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { listProperties } from "@/lib/properties-api";
import { listBuilders } from "@/lib/builders-api";
import { listStaticOptions } from "@/lib/static-options-api";
import { listAdminProfiles } from "@/app/actions/users";
import type { AdminProfile } from "@/lib/admin-profiles";
import type { Property } from "@/lib/properties";
import { cn } from "@/lib/utils";

type Props = {
  user: AdminProfile | null;
};

function greetingForHour(h: number) {
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function SkylineDecor() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 18 });
  const sy = useSpring(my, { stiffness: 40, damping: 18 });
  const x = useTransform(sx, [-0.5, 0.5], [-12, 12]);
  const y = useTransform(sy, [-0.5, 0.5], [-8, 8]);

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      style={{ x, y }}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(107,135,171,0.22),transparent_50%)]" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.55) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <svg
        viewBox="0 0 640 280"
        className="absolute bottom-0 right-0 h-[85%] w-[70%] opacity-40"
        fill="none"
      >
        <rect x="40" y="120" width="70" height="160" fill="rgba(255,255,255,0.12)" />
        <rect x="130" y="70" width="90" height="210" fill="rgba(255,255,255,0.16)" />
        <rect x="240" y="100" width="60" height="180" fill="rgba(255,255,255,0.1)" />
        <rect x="320" y="40" width="110" height="240" fill="rgba(255,255,255,0.18)" />
        <rect x="450" y="90" width="80" height="190" fill="rgba(255,255,255,0.12)" />
        <rect x="550" y="130" width="70" height="150" fill="rgba(255,255,255,0.09)" />
        {[150, 180, 210, 240].map((yy) => (
          <line
            key={yy}
            x1="140"
            y1={yy}
            x2="210"
            y2={yy}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
          />
        ))}
        {[80, 110, 140, 170, 200].map((yy) => (
          <line
            key={`b-${yy}`}
            x1="335"
            y1={yy}
            x2="415"
            y2={yy}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
          />
        ))}
      </svg>
    </motion.div>
  );
}

export function DashboardPageContent({ user }: Props) {
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [areas, setAreas] = useState(0);
  const [builders, setBuilders] = useState(0);
  const [team, setTeam] = useState(0);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [props, areaItems, builderItems, profilesRes] = await Promise.all([
          listProperties(),
          listStaticOptions("area"),
          listBuilders(),
          listAdminProfiles().catch(() => ({ ok: false as const, error: "" })),
        ]);
        if (!alive) return;
        setProperties(props);
        setAreas(areaItems.length);
        setBuilders(builderItems.length);
        setTeam(profilesRes.ok ? profilesRes.profiles.length : 0);
      } catch {
        /* keep zeros */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => {
    const live = properties.filter((p) => p.status === "active").length;
    const drafts = properties.filter((p) => p.status === "draft").length;
    const inactive = properties.filter((p) => p.status === "inactive").length;
    const featured = properties.filter((p) => p.is_featured).length;
    return { live, drafts, inactive, featured, total: properties.length };
  }, [properties]);

  const recent = useMemo(
    () =>
      [...properties]
        .sort((a, b) => {
          const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return tb - ta;
        })
        .slice(0, 6),
    [properties],
  );

  const lastTouched = recent[0] ?? null;
  const featuredSlots = 8;
  const featuredOpen = Math.max(0, featuredSlots - stats.featured);

  const focus = useMemo(() => {
    if (stats.drafts > 0) {
      return {
        label: "Needs review",
        value: `${stats.drafts} draft${stats.drafts === 1 ? "" : "s"}`,
        hint: "Ready to polish and publish live",
        href: "/customization/properties",
        cta: "Review drafts",
      };
    }
    if (featuredOpen > 0) {
      return {
        label: "Homepage",
        value: `${featuredOpen} slot${featuredOpen === 1 ? "" : "s"} open`,
        hint: `${stats.featured} of ${featuredSlots} featured picks filled`,
        href: "/customization/featured",
        cta: "Curate featured",
      };
    }
    return {
      label: "All clear",
      value: "Catalog is live",
      hint: "No drafts waiting · homepage fully curated",
      href: "/customization/properties/new",
      cta: "Add property",
    };
  }, [stats.drafts, stats.featured, featuredOpen]);

  const firstName = (user?.name ?? "there").split(" ")[0];
  const greeting = greetingForHour(now.getHours());
  const timeLabel = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateLabel = now.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const metricCards = [
    {
      label: "Live properties",
      value: stats.live,
      icon: Building2,
      href: "/customization/properties",
      tone: "text-[var(--accent)]",
    },
    {
      label: "Drafts",
      value: stats.drafts,
      icon: FileEdit,
      href: "/customization/properties",
      tone: "text-amber-700",
    },
    {
      label: "Featured",
      value: stats.featured,
      icon: Sparkles,
      href: "/customization/featured",
      tone: "text-[var(--ink)]",
    },
    {
      label: "Areas",
      value: areas,
      icon: MapPin,
      href: "/customization/areas",
      tone: "text-[var(--accent-deep)]",
    },
    {
      label: "Builders",
      value: builders,
      icon: Layers3,
      href: "/customization/builders",
      tone: "text-[var(--ink-mid)]",
    },
    {
      label: "Team",
      value: team,
      icon: Users,
      href: "/users",
      tone: "text-[var(--muted)]",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Immersive welcome */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-lg border border-white/10 bg-[var(--ink-deep)] text-white shadow-[var(--shadow-lift)]"
      >
        <SkylineDecor />
        <div className="relative grid gap-6 p-4 sm:gap-8 sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:p-10">
          <div>
            <p className="type-caption text-[var(--accent-light)]">
              Today&apos;s overview · {dateLabel}
            </p>
            <h1 className="font-display type-hero mt-4 text-[clamp(1.85rem,4vw,3rem)]">
              {greeting},
              <br />
              {firstName}
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/60 sm:text-base">
              Welcome back to Neev Spaces OS. Your publishing pipeline, catalogs,
              and team — one refined command center.
            </p>
            <div className="mt-7 flex w-full max-w-md flex-col gap-2.5">
              <div className="flex flex-wrap gap-2.5 sm:flex-nowrap">
                <Link
                  href="/customization/properties/new"
                  className="btn-brand inline-flex flex-1 items-center justify-center gap-2 px-5 py-2.5"
                >
                  <Plus className="h-4 w-4" strokeWidth={1.6} />
                  New Property
                </Link>
                <Link
                  href="/customization/properties"
                  className="inline-flex flex-1 items-center justify-center gap-2 border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-[var(--ink)]"
                >
                  Manage listings
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <Link
                href="/leads"
                className="inline-flex w-full items-center justify-center gap-2 border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-[var(--ink)]"
              >
                <Inbox className="h-3.5 w-3.5" strokeWidth={1.6} />
                Lead inbox
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-5 border-t border-white/10 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="type-caption text-white/40">Local time</p>
                <p className="font-display type-hero mt-2 text-4xl tabular-nums">
                  {timeLabel}
                </p>
              </div>
              <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/55 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live
              </div>
            </div>

            <div className="rounded-lg border border-white/12 bg-white/[0.06] p-4 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">
                    Focus now
                  </p>
                  <p className="mt-2 font-display text-xl leading-tight text-white">
                    {loading ? "—" : focus.value}
                  </p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-white/50">
                    {loading ? "Loading your next action…" : focus.hint}
                  </p>
                </div>
                {stats.drafts === 0 && featuredOpen === 0 && !loading ? (
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400/90"
                    strokeWidth={1.6}
                  />
                ) : (
                  <span className="mt-0.5 rounded-md border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
                    {loading ? "…" : focus.label}
                  </span>
                )}
              </div>
              <Link
                href={focus.href}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-light)] transition hover:text-white"
              >
                {focus.cta}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">
                Last touch
              </p>
              {loading ? (
                <p className="mt-1.5 text-sm text-white/45">—</p>
              ) : lastTouched ? (
                <Link
                  href={`/customization/properties/${lastTouched.id}`}
                  className="mt-1.5 flex items-center justify-between gap-3 transition hover:opacity-90"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {lastTouched.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/45">
                      {lastTouched.updated_at
                        ? formatRelative(lastTouched.updated_at)
                        : "—"}
                      {lastTouched.status ? ` · ${lastTouched.status}` : ""}
                    </p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/40" />
                </Link>
              ) : (
                <p className="mt-1.5 text-sm text-white/45">
                  No properties edited yet
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Metrics */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metricCards.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href={m.href}
              className="lux-card lux-card-hover group block p-4"
            >
              <div className="flex items-start justify-between">
                <m.icon
                  className={cn("h-4 w-4", m.tone)}
                  strokeWidth={1.6}
                />
                <ArrowUpRight className="h-3.5 w-3.5 text-[var(--muted-foreground)] opacity-0 transition group-hover:opacity-100" />
              </div>
              <p className="font-display type-hero mt-4 text-2xl tabular-nums text-[var(--ink)]">
                {loading ? "—" : m.value}
              </p>
              <p className="type-caption mt-1 text-[var(--muted)]">{m.label}</p>
            </Link>
          </motion.div>
        ))}
      </section>

      {/* Recent activity */}
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="lux-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <div>
              <p className="type-caption text-[var(--accent)]">Publishing</p>
              <h2 className="font-display type-title mt-1 text-lg text-[var(--ink)]">
                Recently edited
              </h2>
            </div>
            <Link
              href="/customization/properties"
              className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)] hover:text-[var(--ink)]"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-4">
                  <div className="skeleton h-14 w-14 shrink-0 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-2/3 rounded" />
                    <div className="skeleton h-3 w-1/3 rounded" />
                  </div>
                </div>
              ))
            ) : recent.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="font-display type-title text-lg text-[var(--ink)]">
                  No properties yet
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Create your first residence to begin the pipeline.
                </p>
                <Link
                  href="/customization/properties/new"
                  className="btn-brand mt-5 inline-flex px-5 py-2.5"
                >
                  New Property
                </Link>
              </div>
            ) : (
              recent.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                >
                  <Link
                    href={`/customization/properties/${p.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-[var(--surface)] sm:px-5"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-[var(--stone,#ededef)]">
                      {p.cover_image_url ? (
                        <Image
                          src={p.cover_image_url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-[var(--muted)]">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--ink)]">
                        {p.title}
                      </p>
                      <p className="truncate text-xs text-[var(--muted)]">
                        {[p.area_name, p.city].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          "inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                          p.status === "active" &&
                            "bg-emerald-50 text-emerald-700",
                          p.status === "draft" && "bg-amber-50 text-amber-700",
                          p.status === "inactive" &&
                            "bg-slate-100 text-slate-600",
                        )}
                      >
                        {p.status}
                      </span>
                      <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                        {p.updated_at ? formatRelative(p.updated_at) : "—"}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="lux-card p-5 sm:p-6">
          <p className="type-caption text-[var(--accent)]">Quick actions</p>
          <h2 className="font-display type-title mt-1 text-lg text-[var(--ink)]">
            Move with intention
          </h2>
          <div className="mt-6 space-y-2">
            {[
              {
                href: "/customization/properties/new",
                label: "Create property",
                hint: "Start a draft residence",
              },
              {
                href: "/customization/featured",
                label: "Curate featured",
                hint: "Up to 8 homepage picks",
              },
              {
                href: "/customization/main-banner",
                label: "Update main banner",
                hint: "Homepage hero imagery",
              },
              {
                href: "/users",
                label: "Invite teammate",
                hint: "Grow the operating team",
              },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="group flex items-center justify-between rounded-md border border-[var(--border)] px-4 py-3 transition hover:border-[var(--accent)]/35 hover:bg-[var(--surface)]"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    {a.label}
                  </p>
                  <p className="text-xs text-[var(--muted)]">{a.hint}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[var(--muted-foreground)] transition group-hover:text-[var(--accent)]" />
              </Link>
            ))}
          </div>
          <p className="mt-6 text-[11px] text-[var(--muted-foreground)]">
            Press{" "}
            <kbd className="rounded border border-[var(--border)] bg-white px-1.5 py-0.5">
              ⌘K
            </kbd>{" "}
            for global search ·{" "}
            <kbd className="rounded border border-[var(--border)] bg-white px-1.5 py-0.5">
              N
            </kbd>{" "}
            new property
          </p>
        </div>
      </section>
    </div>
  );
}
