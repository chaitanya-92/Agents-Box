"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuthSession, getCurrentUser } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "⬡" },
  { href: "/agents",   label: "Agents",    icon: "◈" },
  { href: "/plans",    label: "Plans",     icon: "◇" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { router.replace("/login"); return; }
    setUser(u);
  }, [router]);

  function logout() {
    clearAuthSession();
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="flex h-16 items-center px-5 border-b border-white/10">
          <Link href="/dashboard" className="font-[var(--font-pixel)] text-base text-sky-200 tracking-wider">
            AGENTVERSE
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-3 mt-2">
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
                <span className="text-xs">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
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
      </aside>

      {/* Main content */}
      <div className="ml-56 flex-1">
        {children}
      </div>
    </div>
  );
}
