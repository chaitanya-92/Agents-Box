"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuthSession, getCurrentUser } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "⬡" },
  { href: "/agents",   label: "Agents",    icon: "◈" },
  { href: "/plans",    label: "Plans",     icon: "◇" },
];

function MenuIcon({ open }: { open: boolean }) {
  return (
    <div className="flex flex-col justify-center gap-[5px] w-5 h-5">
      <span className={`block h-px bg-white/70 transition-all duration-200 ${open ? "translate-y-[6px] rotate-45" : ""}`} />
      <span className={`block h-px bg-white/70 transition-all duration-200 ${open ? "opacity-0" : ""}`} />
      <span className={`block h-px bg-white/70 transition-all duration-200 ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { router.replace("/login"); return; }
    setUser(u);
  }, [router]);

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  function logout() {
    clearAuthSession();
    toast("Signed out successfully", "info");
    router.replace("/login");
  }

  if (!user) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 border-2 border-sky-200/30 border-t-sky-200 rounded-full animate-spin" />
        <p className="text-xs text-white/30">Loading workspace…</p>
      </div>
    </div>
  );

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center px-5 border-b border-white/10 shrink-0">
        <Link href="/dashboard" className="font-[var(--font-pixel)] text-base text-sky-200 tracking-wider">
          AGENTVERSE
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3 mt-2 overflow-y-auto">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm transition ${
                active
                  ? "border border-sky-200/20 bg-sky-200/[0.07] text-sky-200"
                  : "text-white/60 hover:bg-white/[0.04] hover:text-white/90"
              }`}
            >
              <span className="text-xs shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4 shrink-0">
        <div className="mb-3">
          <p className="text-xs text-white truncate">{user.name}</p>
          <p className="text-xs text-white/45 truncate">{user.email}</p>
        </div>
        <button
          onClick={logout}
          className="w-full border border-white/10 px-3 py-2 text-xs text-white/55 transition hover:border-rose-400/30 hover:text-rose-300"
        >
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">

      {/* ── Mobile overlay ──────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Desktop sidebar (always visible ≥ md) ────────────────── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-56 flex-col border-r border-white/10 bg-black/80 backdrop-blur-xl">
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar (slide-in) ─────────────────────────────── */}
      {sidebarOpen && (
        <aside className="flex md:hidden fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-white/10 bg-[#080a0d]/95 backdrop-blur-xl animate-fade-up">
          <SidebarContent />
        </aside>
      )}

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">

        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-black/80 backdrop-blur-xl px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 text-white/60 hover:text-white transition"
            aria-label="Toggle menu"
          >
            <MenuIcon open={sidebarOpen} />
          </button>
          <Link href="/dashboard" className="font-[var(--font-pixel)] text-sm text-sky-200 tracking-wider">
            AGENTVERSE
          </Link>
          {/* Current page label */}
          <span className="ml-auto text-xs text-white/35 uppercase tracking-widest">
            {NAV.find(n => pathname.startsWith(n.href))?.label ?? ""}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
