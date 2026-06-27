"use client";

import { useEffect, useState } from "react";
import { pricingPlans, type PricingPlan } from "@agentverse/config";
import { createPricingOrder, getMySubscription, type Subscription, verifyPricingPayment } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { publicEnv } from "@/lib/env";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

async function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return true;
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function PlanCard({ plan, currentPlanId, onPay }: { plan: PricingPlan; currentPlanId?: string; onPay: (plan: PricingPlan) => void }) {
  const isCurrent = currentPlanId === plan.id;
  return (
    <div className={`pixel-panel flex flex-col p-6 ${plan.highlighted ? "border-sky-100/25 shadow-glow" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-[var(--font-pixel)] text-lg text-white">{plan.name}</p>
          {isCurrent && <span className="mt-1 inline-block border border-sky-200/30 px-2 py-0.5 text-[10px] text-sky-200">Current plan</span>}
        </div>
        <div className="text-right">
          <p className="font-[var(--font-pixel)] text-2xl text-sky-200">₹{plan.monthlyPrice}</p>
          <p className="text-[10px] uppercase tracking-widest text-white/35">/ month</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/55">{plan.description}</p>
      <div className="mt-5 space-y-2 flex-1">
        {plan.features.map((f) => (
          <div key={f} className="flex items-start gap-2 text-sm text-white/65">
            <span className="mt-0.5 text-sky-200 text-xs">✓</span>
            {f}
          </div>
        ))}
      </div>
      <button
        onClick={() => onPay(plan)}
        disabled={isCurrent}
        className={`mt-6 w-full border py-2.5 text-sm transition ${
          isCurrent
            ? "border-white/10 text-white/25 cursor-not-allowed"
            : plan.highlighted
            ? "border-sky-200/40 bg-sky-200/10 text-sky-200 hover:bg-sky-200/20"
            : "border-white/15 text-white/70 hover:border-white/30 hover:text-white"
        }`}
      >
        {isCurrent ? "Current plan" : `Choose ${plan.name}`}
      </button>
    </div>
  );
}

export default function PlansPage() {
  const [sub, setSub] = useState<Subscription | null | undefined>(undefined);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    getMySubscription().then((r) => setSub(r.data)).catch(() => setSub(null));
  }, []);

  async function handlePay(plan: PricingPlan) {
    const user = getCurrentUser();
    if (!user) { window.location.href = "/login"; return; }

    if (!publicEnv.razorpayKeyId) {
      setStatus("Razorpay key not configured — add NEXT_PUBLIC_RAZORPAY_KEY_ID to Vercel env vars.");
      return;
    }

    setStatus("Opening checkout…");
    try {
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) throw new Error("Could not load Razorpay");

      const order = (await createPricingOrder(plan.id)).data;

      const rzp = new window.Razorpay({
        key: publicEnv.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "AgentVerse AI",
        description: `${plan.name} · monthly`,
        order_id: order.id,
        prefill: { name: user.name, email: user.email },
        theme: { color: "#b9e6ff" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          setStatus("Verifying payment…");
          try {
            await verifyPricingPayment({
              planId: plan.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            setStatus("✅ Subscription activated!");
            getMySubscription().then((r) => setSub(r.data)).catch(() => {});
          } catch {
            setStatus("Payment captured but verification failed — please contact support.");
          }
        }
      });
      rzp.open();
      setStatus(null);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Checkout failed");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <p className="section-label">Billing</p>
        <h1 className="mt-2 font-[var(--font-pixel)] text-3xl text-white">Choose your plan</h1>
        <p className="mt-2 text-sm text-white/55">
          Razorpay-powered billing. All plans include access to the AgentVerse API.
        </p>
      </div>

      {status && (
        <div className="mb-6 border border-sky-200/20 bg-sky-200/[0.05] px-4 py-3 text-sm text-sky-200">
          {status}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {pricingPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentPlanId={sub?.planId}
            onPay={handlePay}
          />
        ))}
      </div>

      {!publicEnv.razorpayKeyId && (
        <p className="mt-8 text-center text-xs text-amber-300/70">
          ⚠️ Razorpay is in test mode — add your live key via{" "}
          <code className="text-amber-200">NEXT_PUBLIC_RAZORPAY_KEY_ID</code> in Vercel.
        </p>
      )}
    </main>
  );
}
