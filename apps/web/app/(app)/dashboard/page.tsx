import { agentCatalog, pricingPlans } from "@agentverse/config";

export default function DashboardPage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-label">Workspace</p>
          <h1 className="mt-3 font-[var(--font-pixel)] text-3xl text-white">AgentVerse Dashboard</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">
            A starter dashboard for subscriptions, agent usage, and product analytics.
          </p>
        </div>
        <div className="pixel-panel px-5 py-4">
          <p className="text-sm text-white/60">Current plan</p>
          <p className="mt-2 font-[var(--font-pixel)] text-lg text-sky-200">{pricingPlans[1]?.name}</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {[
          { label: "Credits remaining", value: "58,420" },
          { label: "Active subscriptions", value: "1" },
          { label: "Invocations today", value: "214" }
        ].map((stat) => (
          <div key={stat.label} className="pixel-panel p-6">
            <p className="text-sm text-white/55">{stat.label}</p>
            <p className="mt-4 font-[var(--font-pixel)] text-2xl text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="pixel-panel p-6">
          <p className="section-label">Popular Agents</p>
          <div className="mt-5 space-y-3">
            {agentCatalog.slice(0, 8).map((agent) => (
              <div key={agent.id} className="flex items-center justify-between border border-white/10 px-4 py-4">
                <div>
                  <p className="text-sm text-white">{agent.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/45">{agent.category}</p>
                </div>
                <p className="text-sm text-sky-200">Ready</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="pixel-panel p-6">
            <p className="section-label">Subscription Status</p>
            <p className="mt-4 font-[var(--font-pixel)] text-xl text-white">Active</p>
            <p className="mt-4 text-sm leading-7 text-white/65">
              Webhook updates, payment verification, and entitlement refreshes are wired at the API level.
            </p>
          </div>
          <div className="pixel-panel p-6">
            <p className="section-label">Roadmap Ready</p>
            <p className="mt-4 text-sm leading-7 text-white/65">
              This structure can extend into team seats, usage charts, audit logs, background jobs, and agent execution
              history without reworking core boundaries.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

