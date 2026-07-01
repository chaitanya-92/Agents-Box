"use client";

import { useEffect, useState } from "react";
import { pricingPlans, type PricingPlan } from "@agentverse/config";
import { createPricingOrder, getMySubscription, type Subscription, verifyPricingPayment } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { publicEnv } from "@/lib/env";
import { useToast } from "@/components/ui/toast";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type Receipt = {
  planName: string;
  amount: number;
  currency: string;
  orderId: string;
  paymentId: string;
  date: string;
  userName: string;
  userEmail: string;
};

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

function ReceiptModal({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  function downloadReceipt() {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>AgentVerse Payment Receipt</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #111; }
    .header { border-bottom: 2px solid #0ea5e9; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { font-size: 22px; font-weight: 700; color: #0ea5e9; letter-spacing: 1px; }
    .title { font-size: 14px; color: #555; margin-top: 4px; }
    .badge { display: inline-block; background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 10px 0; border-bottom: 1px solid #eee; font-size: 14px; }
    td:first-child { color: #666; }
    td:last-child { text-align: right; font-weight: 500; }
    .amount-row td { font-size: 18px; font-weight: 700; border-bottom: none; padding-top: 16px; }
    .footer { margin-top: 32px; font-size: 12px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">AGENTVERSE AI</div>
    <div class="title">Payment Receipt</div>
  </div>
  <div class="badge">✓ Payment Successful</div>
  <table>
    <tr><td>Plan</td><td>${receipt.planName}</td></tr>
    <tr><td>Date</td><td>${receipt.date}</td></tr>
    <tr><td>Customer</td><td>${receipt.userName}</td></tr>
    <tr><td>Email</td><td>${receipt.userEmail}</td></tr>
    <tr><td>Payment ID</td><td>${receipt.paymentId}</td></tr>
    <tr><td>Order ID</td><td>${receipt.orderId}</td></tr>
    <tr class="amount-row"><td>Amount Paid</td><td>₹${receipt.amount.toLocaleString("en-IN")}</td></tr>
  </table>
  <div class="footer">
    AgentVerse AI · agentverse-ai-web.vercel.app<br/>
    This is a computer-generated receipt and does not require a signature.
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agentverse-receipt-${receipt.paymentId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md border border-sky-200/20 bg-[#0a0f1a] p-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center border border-sky-200/30 bg-sky-200/10 mx-auto">
            <span className="text-2xl">✓</span>
          </div>
          <h2 className="font-[var(--font-pixel)] text-xl text-white">Payment Successful</h2>
          <p className="mt-1 text-sm text-white/50">Your subscription is now active</p>
        </div>

        {/* Receipt lines */}
        <div className="space-y-3 border border-white/10 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-white/50">Plan</span>
            <span className="text-white font-medium">{receipt.planName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Date</span>
            <span className="text-white">{receipt.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Email</span>
            <span className="text-white">{receipt.userEmail}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Payment ID</span>
            <span className="text-white/70 font-mono text-xs">{receipt.paymentId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Order ID</span>
            <span className="text-white/70 font-mono text-xs">{receipt.orderId}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-3">
            <span className="text-white font-semibold">Amount Paid</span>
            <span className="text-sky-200 font-[var(--font-pixel)] text-lg">
              ₹{receipt.amount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={downloadReceipt}
            className="flex-1 border border-sky-200/40 bg-sky-200/10 py-2.5 text-sm text-sky-200 hover:bg-sky-200/20 transition"
          >
            ⬇ Download Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-white/15 py-2.5 text-sm text-white/70 hover:border-white/30 hover:text-white transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
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
  const { toast } = useToast();
  const [sub, setSub] = useState<Subscription | null | undefined>(undefined);
  const [status, setStatus] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    getMySubscription().then((r) => setSub(r.data)).catch(() => setSub(null));
  }, []);

  async function handlePay(plan: PricingPlan) {
    if (paying) return;
    setPaying(true);
    const user = getCurrentUser();
    if (!user) { window.location.href = "/login"; return; }

    if (!publicEnv.razorpayKeyId) {
      setStatus("Razorpay key not configured — add NEXT_PUBLIC_RAZORPAY_KEY_ID to Vercel env vars.");
      setPaying(false);
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
              razorpaySignature: response.razorpay_signature,
            });
            // Show receipt
            setReceipt({
              planName: plan.name,
              amount: order.amount / 100,
              currency: order.currency,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              date: new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }),
              userName: user.name,
              userEmail: user.email,
            });
            setStatus(null);
            toast(`${plan.name} plan activated!`, "success");
            getMySubscription().then((r) => setSub(r.data)).catch(() => {});
          } catch {
            setStatus(null);
            toast("Payment captured but verification failed — contact support.", "error");
          }
        },
      });
      rzp.open();
      setStatus(null);
      setPaying(false);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Checkout failed");
      setPaying(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      {receipt && <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />}

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

      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
