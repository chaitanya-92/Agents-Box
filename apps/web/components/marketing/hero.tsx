"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const demoRows = [
  "nova.chat > Generate a go-to-market plan for an AI OCR product",
  "deep.search > Summarize 5 competitor pricing pages",
  "code.pilot > Explain this TypeScript error in plain English"
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-24">
        <div className="space-y-8">
          <Badge>Launch-ready AI SaaS</Badge>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="space-y-5"
          >
            <p className="section-label">One Platform. Unlimited AI Agents.</p>
            <h1 className="max-w-4xl font-[var(--font-pixel)] text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
              Deploy chat, vision, voice, code, and research agents from one control plane.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-white/70">
              AgentVerse AI gives teams a unified SaaS platform for discovering agents, managing subscriptions,
              tracking usage, and invoking production-ready AI workflows.
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-3">
            <Link href="/register">
              <Button size="lg">
                Start building <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#agents">
              <Button variant="ghost" size="lg">
                Browse agents
              </Button>
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Active agents", value: "28+" },
              { label: "Avg. onboarding", value: "< 5 min" },
              { label: "API uptime goal", value: "99.9%" }
            ].map((stat) => (
              <div key={stat.label} className="pixel-panel px-4 py-5">
                <p className="font-[var(--font-pixel)] text-xl text-sky-200">{stat.value}</p>
                <p className="mt-2 text-sm text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="pixel-panel relative overflow-hidden p-5 sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <TerminalSquare className="h-5 w-5 text-sky-200" />
              <span className="font-[var(--font-pixel)] text-xs text-white/85">AgentVerse Console</span>
            </div>
            <Sparkles className="h-4 w-4 text-sky-100/75" />
          </div>

          <div className="space-y-3">
            {demoRows.map((row) => (
              <div key={row} className="border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70">
                {row}
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="border border-white/10 bg-white/[0.03] p-4">
              <p className="section-label">Routing</p>
              <p className="mt-3 text-sm leading-7 text-white/70">
                Invoke the right agent with a modular registry, access controls, and subscription-aware execution.
              </p>
            </div>
            <div className="border border-white/10 bg-white/[0.03] p-4">
              <p className="section-label">Billing</p>
              <p className="mt-3 text-sm leading-7 text-white/70">
                Razorpay checkout, signature verification, webhooks, and entitlement sync included.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

