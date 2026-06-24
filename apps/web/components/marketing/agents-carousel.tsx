"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { agentCatalog } from "@agentverse/config";
import { Button } from "@/components/ui/button";

const featuredAgents = agentCatalog.filter((agent) => agent.featured).concat(agentCatalog.slice(0, 3));

export function AgentsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeAgent = featuredAgents[activeIndex];

  if (!activeAgent) {
    return null;
  }

  const next = () => setActiveIndex((current) => (current + 1) % featuredAgents.length);
  const prev = () => setActiveIndex((current) => (current - 1 + featuredAgents.length) % featuredAgents.length);

  return (
    <section id="agents" className="border-y border-white/10 bg-black/25 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 space-y-4">
          <p className="section-label">Agent Showcase</p>
          <h2 className="font-[var(--font-pixel)] text-3xl text-white sm:text-4xl">
            Explore the agent roster through a console-style carousel.
          </h2>
          <p className="max-w-3xl text-base leading-8 text-white/70">
            This section borrows the framed interaction model from your fourth reference screenshot, but repurposes it
            into a browseable list of AgentVerse capabilities.
          </p>
        </div>

        <div className="grid items-center gap-5 lg:grid-cols-[72px_1fr_72px]">
          <div className="hidden justify-center lg:flex">
            <Button variant="ghost" size="lg" onClick={prev} aria-label="Previous agent">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>

          <div className="pixel-panel min-h-[520px] overflow-hidden p-6 sm:p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="section-label">Agents List</p>
                <p className="mt-3 font-[var(--font-pixel)] text-xl text-white">Featured capabilities</p>
              </div>
              <div className="hidden items-center gap-2 md:flex">
                {featuredAgents.map((agent, index) => (
                  <button
                    key={agent.id}
                    onClick={() => setActiveIndex(index)}
                    className={`h-3 w-3 border ${index === activeIndex ? "border-sky-100 bg-sky-100" : "border-white/35 bg-transparent"}`}
                    aria-label={`Go to ${agent.name}`}
                  />
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeAgent.id}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.25 }}
                className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"
              >
                <div className="space-y-4 border border-white/10 bg-white/[0.03] p-4">
                  <p className="section-label">Available Agents</p>
                  <div className="space-y-2">
                    {featuredAgents.map((agent, index) => (
                      <button
                        key={agent.id}
                        onClick={() => setActiveIndex(index)}
                        className={`flex w-full items-center justify-between border px-4 py-4 text-left text-sm transition ${
                          index === activeIndex
                            ? "border-sky-100/40 bg-sky-100/10 text-white"
                            : "border-white/10 bg-black/15 text-white/60 hover:bg-white/[0.04]"
                        }`}
                      >
                        <span>{agent.name}</span>
                        <span className="text-[10px] uppercase tracking-[0.22em]">{agent.category}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="border border-white/10 p-5">
                    <div
                      className={`mb-5 h-40 w-full bg-gradient-to-br ${activeAgent.accent} opacity-85`}
                    />
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-[var(--font-pixel)] text-2xl text-white">{activeAgent.name}</p>
                        <p className="mt-3 text-sm uppercase tracking-[0.22em] text-sky-100/70">
                          {activeAgent.tagline}
                        </p>
                      </div>
                      <div className="border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.22em] text-white/65">
                        {activeAgent.category}
                      </div>
                    </div>
                    <p className="mt-5 max-w-2xl text-sm leading-7 text-white/70">{activeAgent.description}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border border-white/10 p-5">
                      <p className="section-label">Core Capabilities</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {activeAgent.capabilities.map((capability) => (
                          <span
                            key={capability}
                            className="border border-white/10 bg-white/[0.03] px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/70"
                          >
                            {capability}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="border border-white/10 p-5">
                      <p className="section-label">Execution Profile</p>
                      <div className="mt-4 space-y-4 text-sm text-white/70">
                        <p>Routing: subscription-aware agent execution</p>
                        <p>Access: protected by entitlement checks</p>
                        <p>Delivery: available via UI and Agent API Hub</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex items-center justify-center gap-3 lg:hidden">
              <Button variant="ghost" size="sm" onClick={prev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={next}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="hidden justify-center lg:flex">
            <Button variant="ghost" size="lg" onClick={next} aria-label="Next agent">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
