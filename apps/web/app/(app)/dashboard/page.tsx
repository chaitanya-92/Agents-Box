"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { agentCatalog, pricingPlans } from "@agentverse/config";
import { type Subscription, type UsageStats, getMySubscription, getUsageStats } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

function StatCardSkeleton() {
  return (
    <div className="pixel-panel p-6">
      <Skeleton className="h-3 w-28 mb-5" />
      <Skeleton className="h-7 w-20" />
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="pixel-panel p-6 animate-fade-up">
      <p className="text-sm text-white/55">{label}</p>
      <p className="mt-4 font-[var(--font-pixel)] text-2xl text-white">{value}</p>
      {sub && <p className="mt-2 text-xs text-white/35">{sub}</p>}
    </div>
  );
}

// Build last-7-days usage map from recentUsage array
function buildDailyChart(recentUsage: Array<{ createdAt: string }>): { day: string; count: number }[] {
  const days: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days[d.toISOString().slice(0, 10)] = 0;
  }
  recentUsage.forEach(({ createdAt }) => {
    const key = new Date(createdAt).toISOString().slice(0, 10);
    if (key in days) days[key]++;
  });
  return Object.entries(days).map(([day, count]) => ({ day, count }));
}

function UsageChart({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-16">
      {data.map(({ day, count }) => (
        <div key={day} className="flex-1 flex flex-col items-center gap-1" title={`${day}: ${count} calls`}>
          <div
            className="w-full rounded-sm transition-all"
            style={{
              height: `${Math.max(3, (count / max) * 52)}px`,
              background: count > 0 ? "rgba(186,230,255,0.5)" : "rgba(255,255,255,0.08)",
            }}
          />
          <span className="text-[9px] text-white/25 hidden sm:block">
            {new Date(day).toLocaleDateString("en-IN", { weekday: "short" }).slice(0, 2)}
          </span>
        </div>
      ))}
    </div>
  );
}

const PLAN_CREDITS: Record<string, number> = { starter: 10000, pro: 75000, scale: 250000 };

export default function DashboardPage() {
  const { toast } = useToast();
  const [sub, setSub] = useState<Subscription | null | undefined>(undefined);
  const [usage, setUsage] = useState<UsageStats | null | undefined>(undefined);
  const user = typeof window !== "undefined" ? getCurrentUser() : null;

  useEffect(() => {
    getMySubscription()
      .then((r) => setSub(r.data))
      .catch(() => { setSub(null); toast("Could not load subscription", "error"); });

    getUsageStats()
      .then((r) => setUsage(r.data))
      .catch(() => { setUsage(null); });
  }, []);

  const plan = pricingPlans.find((p) => p.id === sub?.planId);
  const totalCredits = plan ? PLAN_CREDITS[plan.id] ?? 0 : 0;
  const usedCredits = usage?.totalInvocations ?? 0;
  const remaining = Math.max(0, totalCredits - usedCredits);
  const isLoading = sub === undefined || usage === undefined;
  const pctUsed = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0;
  const showUpgradeNudge = sub && pctUsed >= 80 && sub.planId !== "scale";
  const chartData = usage ? buildDailyChart(usage.recentUsage) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">

      {/* Upgrade nudge */}
      {showUpgradeNudge && (
        <div className="mb-6 flex items-center justify-between gap-4 border border-amber-400/30 bg-amber-400/[0.06] px-5 py-3 animate-fade-up">
          <div className="flex items-center gap-2.5">
            <span className="text-amber-300">⚠</span>
            <p className="text-sm text-amber-200">
              You've used <strong>{Math.round(pctUsed)}%</strong> of your {plan?.name} credits.
              Upgrade before they run out.
            </p>
          </div>
          <Link
            href="/plans"
            className="shrink-0 border border-amber-400/40 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-400/10 transition"
          >
            Upgrade →
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="section-label">Workspace</p>
          <h1 className="mt-2 font-[var(--font-pixel)] text-2xl sm:text-3xl text-white">
            {user ? `Hey, ${user.name.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="mt-2 text-sm text-white/55">Your AgentVerse workspace at a glance.</p>
        </div>
        <div className="pixel-panel px-4 py-3 sm:px-5 sm:py-4 text-right shrink-0">
          <p className="text-xs text-white/45">Current plan</p>
          {sub === undefined ? (
            <Skeleton className="mt-2 h-5 w-20 ml-auto" />
          ) : sub ? (
            <div>
              <p className="mt-1 font-[var(--font-pixel)] text-base sm:text-lg text-sky-200">{plan?.name ?? sub.planId}</p>
              {sub.status === "TRIAL" && (
                <p className="text-xs text-amber-300 mt-0.5">Trial active</p>
              )}
            </div>
          ) : (
            <Link href="/plans" className="mt-1 block text-sm text-amber-300 hover:text-amber-200">
              No plan — Upgrade →
            </Link>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-3">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Credits remaining"
              value={sub ? remaining.toLocaleString() : "—"}
              sub={sub ? `of ${totalCredits.toLocaleString()} total` : undefined}
            />
            <StatCard
              label="Active subscription"
              value={sub ? (sub.status === "TRIAL" ? "Trial" : "Active") : "None"}
              sub={sub?.currentPeriodEnd ? `${sub.status === "TRIAL" ? "Trial ends" : "Renews"} ${new Date(sub.currentPeriodEnd).toLocaleDateString()}` : undefined}
            />
            <StatCard
              label="Invocations today"
              value={usage?.todayInvocations ?? "—"}
              sub={usage ? `${usage.totalInvocations.toLocaleString()} total` : undefined}
            />
          </>
        )}
      </div>

      {/* Bottom section */}
      <div className="mt-6 sm:mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">

        {/* Left: Popular Agents */}
        <div className="space-y-5">

          {/* Usage chart */}
          {(chartData || isLoading) && (
            <div className="pixel-panel p-5 sm:p-6">
              <p className="section-label mb-4">Usage — last 7 days</p>
              {isLoading ? (
                <div className="flex items-end gap-1.5 h-16">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex-1 skeleton" style={{ height: `${20 + i * 4}px` }} />
                  ))}
                </div>
              ) : chartData ? (
                <UsageChart data={chartData} />
              ) : null}
            </div>
          )}

          {/* Popular agents */}
          <div className="pixel-panel p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="section-label">Popular Agents</p>
              <Link href="/agents" className="text-xs text-sky-200 hover:text-sky-100 transition">
                View all →
              </Link>
            </div>
            <div className="space-y-2">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="border border-white/10 px-4 py-3 flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-2 w-16" />
                    </div>
                    <Skeleton className="h-3 w-10" />
                  </div>
                ))
              ) : (
                agentCatalog.filter((a) => a.featured).slice(0, 6).map((agent) => (
                  <Link
                    key={agent.id}
                    href={`/agents/${agent.id}`}
                    className="flex items-center justify-between border border-white/10 px-4 py-3 transition hover:border-sky-200/20 hover:bg-sky-200/[0.04] group"
                  >
                    <div>
                      <p className="text-sm text-white group-hover:text-sky-100 transition">{agent.name}</p>
                      <p className="mt-0.5 text-xs text-white/40 uppercase tracking-widest">{agent.category}</p>
                    </div>
                    <span className="text-xs text-sky-200 opacity-0 group-hover:opacity-100 transition">Use →</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4 sm:space-y-5">
          {/* Subscription */}
          <div className="pixel-panel p-5 sm:p-6">
            <p className="section-label">Subscription</p>
            {sub === undefined ? (
              <div className="mt-4 space-y-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-3 w-28" />
              </div>
            ) : sub ? (
              <div className="animate-fade-up">
                <p className="mt-3 font-[var(--font-pixel)] text-base text-white">
                  {sub.status === "TRIAL" ? "Trial" : "Active"}
                </p>
                {sub.currentPeriodEnd && (
                  <p className="mt-2 text-xs text-white/45">
                    {sub.status === "TRIAL" ? "Trial ends" : "Renews"}{" "}
                    {new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
                <Link href="/plans" className="mt-4 block border border-white/10 px-4 py-2 text-center text-xs text-white/55 hover:border-white/20 hover:text-white transition">
                  Manage plan →
                </Link>
              </div>
            ) : (
              <div className="animate-fade-up">
                <p className="mt-3 text-sm text-white/55">No active subscription.</p>
                <Link
                  href="/plans"
                  className="mt-4 block border border-sky-200/30 px-4 py-2 text-center text-xs text-sky-200 hover:bg-sky-200/[0.06] transition"
                >
                  Choose a plan →
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="pixel-panel p-5 sm:p-6">
            <p className="section-label">Quick Actions</p>
            <div className="mt-4 space-y-2">
              {[
                { href: "/agents", label: "Browse all agents" },
                { href: "/plans", label: "View plans" },
                { href: "/api-keys", label: "API keys" },
                { href: "/invoices", label: "Invoice history" },
                { href: "/conversations", label: "Past conversations" },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="flex items-center justify-between border border-white/10 px-4 py-3 text-xs text-white/70 hover:border-white/20 hover:text-white transition group">
                  <span>{label}</span>
                  <span className="text-white/30 group-hover:text-white/70 transition">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
