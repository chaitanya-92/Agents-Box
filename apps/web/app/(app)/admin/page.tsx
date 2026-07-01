"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminStats, getAdminUsers, type AdminStats, type AdminUser } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="pixel-panel p-5">
      <p className="text-xs text-white/40 uppercase tracking-widest mb-3">{label}</p>
      <p className="font-[var(--font-pixel)] text-2xl text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/35">{sub}</p>}
    </div>
  );
}

// Mini bar chart
function BarChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {entries.map(([date, count]) => (
        <div key={date} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-sky-200/40 rounded-sm transition-all"
            style={{ height: `${Math.max(4, (count / max) * 52)}px` }}
            title={`${date}: ${count}`}
          />
          <span className="text-[9px] text-white/25 hidden sm:block">
            {new Date(date).toLocaleDateString("en-IN", { weekday: "short" }).slice(0, 2)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

  const user = typeof window !== "undefined" ? getCurrentUser() : null;

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    getAdminStats()
      .then((r) => setStats(r.data))
      .catch(() => toast("Could not load stats", "error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setUsersLoading(true);
    getAdminUsers(page, search)
      .then((r) => {
        setUsers(r.data.users);
        setTotal(r.data.total);
        setPages(r.data.pages);
      })
      .catch(() => toast("Could not load users", "error"))
      .finally(() => setUsersLoading(false));
  }, [page, search]);

  if (user?.role !== "ADMIN") {
    return null;
  }

  const planBadge = (subs: AdminUser["subscriptions"]) => {
    if (!subs.length) return <span className="text-xs text-white/25">—</span>;
    const s = subs[0];
    const color = s.status === "ACTIVE" ? "text-emerald-300 border-emerald-400/30 bg-emerald-400/10"
      : s.status === "TRIAL" ? "text-amber-300 border-amber-400/30 bg-amber-400/10"
      : "text-white/40 border-white/10 bg-white/5";
    return (
      <span className={`border px-2 py-0.5 text-[10px] rounded ${color}`}>
        {s.planId} · {s.status}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">

      <div className="mb-8">
        <p className="section-label">Internal</p>
        <h1 className="mt-2 font-[var(--font-pixel)] text-2xl sm:text-3xl text-white">Admin Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="pixel-panel p-5"><Skeleton className="h-8 w-16" /></div>)
        ) : stats ? (
          <>
            <StatBox label="Total Users" value={stats.totalUsers.toLocaleString()} />
            <StatBox label="Active Subs" value={stats.activeSubscriptions.toLocaleString()} />
            <StatBox
              label="Total Revenue"
              value={`₹${(stats.totalRevenue / 100).toLocaleString("en-IN")}`}
            />
            <StatBox
              label="This Month"
              value={`₹${(stats.monthRevenue / 100).toLocaleString("en-IN")}`}
            />
          </>
        ) : null}
      </div>

      {/* Signups chart */}
      {stats && (
        <div className="pixel-panel p-5 mb-8">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-4">Signups — last 7 days</p>
          <BarChart data={stats.signupsByDay} />
        </div>
      )}

      {/* Users table */}
      <div className="pixel-panel">
        <div className="flex items-center justify-between gap-3 p-5 border-b border-white/[0.07]">
          <p className="section-label">Users ({total})</p>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name or email…"
            className="border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs text-white placeholder:text-white/25 focus:border-sky-200/30 focus:outline-none w-48"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {["Name", "Email", "Plan", "Verified", "Joined"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs text-white/40 uppercase tracking-widest font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.05]">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-3"><Skeleton className="h-3 w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : users.map((u) => (
                <tr key={u.id} className="border-b border-white/[0.05] hover:bg-white/[0.02] transition">
                  <td className="px-5 py-3 text-white">{u.name}</td>
                  <td className="px-5 py-3 text-white/60 font-mono text-xs">{u.email}</td>
                  <td className="px-5 py-3">{planBadge(u.subscriptions)}</td>
                  <td className="px-5 py-3">
                    <span className={u.emailVerified ? "text-emerald-400" : "text-white/30"}>
                      {u.emailVerified ? "✓" : "✗"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-white/40">
                    {new Date(u.createdAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.07]">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs text-white/50 hover:text-white disabled:opacity-30 transition"
            >
              ← Prev
            </button>
            <span className="text-xs text-white/35">Page {page} of {pages}</span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="text-xs text-white/50 hover:text-white disabled:opacity-30 transition"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
