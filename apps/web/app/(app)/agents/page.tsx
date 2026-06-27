"use client";

import Link from "next/link";
import { useState } from "react";
import { agentCatalog, type AgentCategory } from "@agentverse/config";

const CATEGORIES: { label: string; value: AgentCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Chat", value: "chat" },
  { label: "Voice", value: "voice" },
  { label: "Vision", value: "vision" },
  { label: "Research", value: "research" },
  { label: "Productivity", value: "productivity" },
  { label: "Business", value: "business" },
  { label: "Developer", value: "developer" },
];

export default function AgentsPage() {
  const [filter, setFilter] = useState<AgentCategory | "all">("all");
  const [search, setSearch] = useState("");

  const agents = agentCatalog.filter((a) => {
    const matchCat = filter === "all" || a.category === filter;
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.tagline.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <p className="section-label">Marketplace</p>
        <h1 className="mt-2 font-[var(--font-pixel)] text-3xl text-white">Agent Catalog</h1>
        <p className="mt-2 text-sm text-white/55">Choose an agent and start building. All agents require an active subscription.</p>
      </div>

      {/* Search + filter */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search agents…"
          className="w-full border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-sky-200/30 focus:outline-none sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilter(c.value)}
              className={`border px-3 py-1.5 text-xs transition ${
                filter === c.value
                  ? "border-sky-200/40 bg-sky-200/10 text-sky-200"
                  : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Link
            key={agent.id}
            href={`/agents/${agent.id}`}
            className="pixel-panel group flex flex-col p-5 transition hover:border-sky-200/20"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-[var(--font-pixel)] text-sm text-white group-hover:text-sky-200">{agent.name}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-white/35">{agent.category}</p>
              </div>
              {agent.featured && (
                <span className="border border-sky-200/30 px-2 py-0.5 text-[10px] text-sky-200">Featured</span>
              )}
            </div>
            <p className="mt-3 text-sm leading-6 text-white/55">{agent.tagline}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {agent.capabilities.map((cap) => (
                <span key={cap} className="border border-white/10 px-2 py-0.5 text-[10px] text-white/40">{cap}</span>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <span className="text-xs text-sky-200 opacity-0 group-hover:opacity-100 transition">Use agent →</span>
            </div>
          </Link>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="py-20 text-center text-sm text-white/40">No agents match your search.</div>
      )}
    </main>
  );
}
