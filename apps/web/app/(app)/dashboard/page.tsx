"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { agentCatalog, pricingPlans } from "@agentverse/config";
import { type Subscription, type UsageStats, getMySubscription, getUsageStats } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="pixel-panel p-6">
      <p className="text-sm text-white/55">{label}</p>
      <p className="mt-4 font-[var(--font-pixel)] text-2xl text-white">{value}</p>
    </div>
  );
}

const PLAN_CREDITS: Record<string, number> = { starter: 10000, pro: 75000, scale: 250000 };

export default function DashboardPage() {
  const [sub, setSub] = useState<Subscription | null | undefined>(undefined);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const user = typeof window !== "undefined" ? getCurrentUser() : null;

  useEffect(() => {
    getMySubscription().then((r) => setSub(r.data)).catch(() => setSub(null));
    getUsageStats().then((r) => setUsage(r.data)).catch(() => setUsage(null));
  }, []);

  const plan = pricingPlans.find((p) => p.id === sub?.planId);
  const totalCredits = plan ? PLAN_CREDITS[plan.id] ?? 0 : 0;
  const usedCredits = usage?.totalInvocations ?? 0;
  const remaining = Math.max(0, totalCredits - usedCredits);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="section-label">Workspace</p>
          <h1 className="mt-2 font-[var(--font-pixel)] text-3xl text-white">
            {user ? `Hey, ${user.name.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="mt-2 text-sm text-white/55">Your AgentVerse workspace at a glance.</p>
        </div>
        <div className="pixel-panel px-5 py-4 text-right">
          <p className="text-xs text-white/45">Current plan</p>
          {sub === undefined ? (
            <p className="mt-1 text-sm text-white/30">Loading…</p>
          ) : sub ? (
            <p className="mt-1 font-[var(--font-pixel)] text-lg text-sky-200">{plan?.name ?? sub.planId}</p>
          ) : (
            <Link href="/plans" className="mt-1 block text-sm text-amber-300 hover:text-amber-200">
              No plan — Upgrade →
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <StatCard label="Credits remaining" value={sub ? remaining.toLocaleString() : "—"} />
        <StatCard label="Active subscription" value={sub ? "Active" : "None"} />
        <StatCard label="Invocations today" value={usage?.todayInvocations ?? "—"} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        {/* Agents */}
        <div className="pixel-panel p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="section-label">Popular Agents</p>
            <Link href="/agents" className="text-xs text-sky-200 hover:text-sky-100">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {agentCatalog.filter((a) => a.featured).slice(0, 6).map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}`}
                className="flex items-center justify-between border border-white/10 px-4 py-3 transition hover:border-sky-200/20 hover:bg-sky-200/[0.04]"
              >
                <div>
                  <p className="text-sm text-white">{agent.name}</p>
                  <p className="mt-0.5 text-xs text-white/40 uppercase tracking-widest">{agent.category}</p>
                </div>
                <span className="text-xs text-sky-200">Use →</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Status panels */}
        <div className="space-y-5">
          <div className="pixel-panel p-6">
            <p className="section-label">Subscription</p>
            {sub === undefined ? (
              <p className="mt-4 text-sm text-white/30">Loading…</p>
            ) : sub ? (
              <>
                <p className="mt-3 font-[var(--font-pixel)] text-lg text-white">Active</p>
                {sub.currentPeriodEnd && (
                  <p className="mt-2 text-xs text-white/45">
                    Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="mt-3 text-sm text-white/55">No active subscription.</p>
                <Link
                  href="/plans"
                  className="mt-4 block border border-sky-200/30 px-4 py-2 text-center text-xs text-sky-200 hover:bg-sky-200/[0.06]"
                >
                  Choose a plan
                </Link>
              </>
            )}
          </div>

          <div className="pixel-panel p-6">
            <p className="section-label">Quick Actions</p>
            <div className="mt-4 space-y-2">
              <Link href="/agents" className="block border border-white/10 px-4 py-3 text-xs text-white/70 hover:border-white/20 hover:text-white">
                Browse all agents →
              </Link>
              <Link href="/plans" className="block border border-white/10 px-4 py-3 text-xs text-white/70 hover:border-white/20 hover:text-white">
                View plans →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
