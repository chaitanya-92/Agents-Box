"use client";

import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-[var(--font-pixel)] text-xl text-sky-200 sm:text-2xl">
          AGENTVERSE
        </Link>
        <nav className="hidden items-center gap-3 md:flex">
          {siteConfig.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/80 transition hover:bg-white/[0.06]"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Login
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Start Free</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

