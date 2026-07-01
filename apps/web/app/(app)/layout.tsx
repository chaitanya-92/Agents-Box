"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuthSession, getCurrentUser } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "⬡" },
  { href: "/agents",   label: "Agents",    icon: "◈" },
  { href: "/plans",    label: "Plans",     icon: "◇" },
  { href: "/profile",  label: "Profile",   icon: "◉" },
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

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform duration-200" style={{ transform: collapsed ? "rotate(180deg)" : "none" }}>
      <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const COLLAPSED_KEY = "av_sidebar_collapsed";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { router.replace("/login"); return; }
    setUser(u);
    // Restore collapsed state
    const saved = localStorage.getItem(COLLAPSED_KEY);
    if (saved === "1") setCollapsed(true);
  }, [router]);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  function toggleCollapse() {
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSED_KEY, c ? "0" : "1");
      return !c;
    });
  }

  function handleLogout() {
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

  const sidebarW = collapsed ? "w-14" : "w-56";

  function SidebarContent({ isMobile = false }: { isMobile?: boolean }) {
    return (
      <>
        {/* Logo row */}
        <div className={`flex h-16 items-center border-b border-white/10 shrink-0 ${collapsed && !isMobile ? "justify-center px-0" : "px-5 justify-between"}`}>
          {(!collapsed || isMobile) && (
            <Link href="/dashboard" className="font-[var(--font-pixel)] text-sm text-sky-200 tracking-wider truncate">
              AGENTVERSE
            </Link>
          )}
          {collapsed && !isMobile && (
            <Link href="/dashboard" className="font-[var(--font-pixel)] text-xs text-sky-200">AV</Link>
          )}
          {/* Collapse toggle — desktop only */}
          {!isMobile && (
            <button
              onClick={toggleCollapse}
              className="text-white/30 hover:text-white transition p-1 ml-auto"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <CollapseIcon collapsed={collapsed} />
            </button>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 p-2 mt-2 overflow-y-auto">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm transition ${
                  collapsed && !isMobile ? "justify-center px-0" : ""
                } ${
                  active
                    ? "border border-sky-200/20 bg-sky-200/[0.07] text-sky-200"
                    : "text-white/60 hover:bg-white/[0.04] hover:text-white/90"
                }`}
              >
                <span className="text-xs shrink-0">{item.icon}</span>
                {(!collapsed || isMobile) && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className={`border-t border-white/10 p-3 shrink-0 ${collapsed && !isMobile ? "flex flex-col items-center" : ""}`}>
          {(!collapsed || isMobile) && (
            <div className="mb-3 px-1">
              <p className="text-xs text-white truncate">{user?.name}</p>
              <p className="text-xs text-white/45 truncate">{user?.email}</p>
            </div>
          )}
          <button
            onClick={() => setShowLogoutModal(true)}
            title="Sign out"
            className={`border border-white/10 text-xs text-white/55 transition hover:border-rose-400/30 hover:text-rose-300 ${
              collapsed && !isMobile ? "w-9 h-9 flex items-center justify-center" : "w-full px-3 py-2"
            }`}
          >
            {collapsed && !isMobile ? "↩" : "Sign out"}
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-screen">

      {/* Logout confirmation modal */}
      <Modal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Sign out?"
        description="You'll be returned to the login screen. Any unsaved work will be lost."
        confirmLabel="Sign out"
        confirmVariant="danger"
        onConfirm={handleLogout}
      />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex fixed inset-y-0 left-0 z-30 flex-col border-r border-white/10 bg-black/80 backdrop-blur-xl transition-all duration-200 ${sidebarW}`}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <aside className="flex md:hidden fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-white/10 bg-[#080a0d]/95 backdrop-blur-xl animate-fade-up">
          <SidebarContent isMobile />
        </aside>
      )}

      {/* Main */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${collapsed ? "md:ml-14" : "md:ml-56"}`}>
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-black/80 backdrop-blur-xl px-4 py-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1 text-white/60 hover:text-white transition"
            aria-label="Toggle menu"
          >
            <MenuIcon open={mobileOpen} />
          </button>
          <Link href="/dashboard" className="font-[var(--font-pixel)] text-sm text-sky-200 tracking-wider">
            AGENTVERSE
          </Link>
          <span className="ml-auto text-xs text-white/35 uppercase tracking-widest">
            {NAV.find(n => pathname.startsWith(n.href))?.label ?? ""}
          </span>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
