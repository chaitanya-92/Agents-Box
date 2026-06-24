"use client";

import { motion } from "framer-motion";
import { Bot, CreditCard, LockKeyhole, Network, ShieldCheck, Workflow } from "lucide-react";

const features = [
  {
    title: "Modular Agent Catalog",
    description: "Agents are driven from configuration so new entries can ship without rewriting the UI or API.",
    icon: Bot
  },
  {
    title: "Secure Authentication",
    description: "JWT auth, refresh tokens, OAuth hooks, password hashing, and route protection by default.",
    icon: LockKeyhole
  },
  {
    title: "Subscription Billing",
    description: "Razorpay payment flows with webhook verification, payment persistence, and status management.",
    icon: CreditCard
  },
  {
    title: "Execution Controls",
    description: "Usage metering, feature gating, and entitlement checks before invoking premium agents.",
    icon: ShieldCheck
  },
  {
    title: "API Hub",
    description: "One programmable interface for downstream apps to consume the complete AgentVerse platform.",
    icon: Network
  },
  {
    title: "Workflow Ready",
    description: "A clean architecture foundation for queues, background jobs, analytics, and team collaboration.",
    icon: Workflow
  }
];

export function PlatformGrid() {
  return (
    <section id="platform" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 space-y-4">
        <p className="section-label">Platform Architecture</p>
        <h2 className="font-[var(--font-pixel)] text-3xl text-white sm:text-4xl">
          SaaS infrastructure built for AI products that need to scale.
        </h2>
        <p className="max-w-3xl text-base leading-8 text-white/70">
          The frontend and API are split cleanly, the data model supports subscriptions and usage tracking, and the
          agent layer is designed to evolve as the catalog expands.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="pixel-panel p-6"
            >
              <Icon className="h-6 w-6 text-sky-200" />
              <h3 className="mt-5 font-[var(--font-pixel)] text-sm text-white">{feature.title}</h3>
              <p className="mt-4 text-sm leading-7 text-white/68">{feature.description}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

