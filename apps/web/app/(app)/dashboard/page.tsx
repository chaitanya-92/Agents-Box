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

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">

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
            <p className="mt-1 font-[var(--font-pixel)] text-base sm:text-lg text-sky-200">{plan?.name ?? sub.planId}</p>
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
              value={sub ? "Active" : "None"}
              sub={sub?.currentPeriodEnd ? `Renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}` : undefined}
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

        {/* Popular Agents */}
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
                <p className="mt-3 font-[var(--font-pixel)] text-base text-white">Active</p>
                {sub.currentPeriodEnd && (
                  <p className="mt-2 text-xs text-white/45">
                    Renews {new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
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
              <Link href="/agents" className="flex items-center justify-between border border-white/10 px-4 py-3 text-xs text-white/70 hover:border-white/20 hover:text-white transition group">
                <span>Browse all agents</span>
                <span className="text-white/30 group-hover:text-white/70 transition">→</span>
              </Link>
              <Link href="/plans" className="flex items-center justify-between border border-white/10 px-4 py-3 text-xs text-white/70 hover:border-white/20 hover:text-white transition group">
                <span>View plans</span>
                <span className="text-white/30 group-hover:text-white/70 transition">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
