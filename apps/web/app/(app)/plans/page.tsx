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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jspdf?: any;
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

async function loadJsPDF(): Promise<boolean> {
  if (window.jspdf) return true;
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

async function downloadPDF(receipt: Receipt) {
  const ok = await loadJsPDF();
  if (!ok || !window.jspdf) {
    // Fallback: print-to-PDF
    window.print();
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { jsPDF } = window.jspdf as any;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const W = 210;
  const margin = 20;
  let y = 20;

  // Background
  doc.setFillColor(13, 20, 36);
  doc.rect(0, 0, W, 297, "F");

  // Header stripe
  doc.setFillColor(10, 25, 50);
  doc.rect(0, 0, W, 40, "F");

  // Logo
  doc.setTextColor(186, 230, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("AGENTVERSE AI", margin, y + 8);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 140, 160);
  doc.text("PAYMENT RECEIPT", margin, y + 16);

  // Receipt ID (top right)
  doc.setFontSize(7);
  doc.setTextColor(100, 120, 140);
  doc.text(`Receipt: ${receipt.paymentId.slice(-8).toUpperCase()}`, W - margin, y + 8, { align: "right" });
  doc.text(receipt.date, W - margin, y + 15, { align: "right" });

  y = 55;

  // Success badge
  doc.setFillColor(16, 185, 129, 15);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(margin, y, 55, 9, 2, 2, "FD");
  doc.setTextColor(52, 211, 153);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("✓  PAYMENT SUCCESSFUL", margin + 4, y + 6);

  y += 22;

  // Plan box
  doc.setFillColor(20, 35, 60);
  doc.setDrawColor(50, 80, 120);
  doc.rect(margin, y, W - margin * 2, 28, "FD");
  doc.setTextColor(120, 160, 200);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("ACTIVE PLAN", margin + 6, y + 9);
  doc.setTextColor(186, 230, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(receipt.planName, margin + 6, y + 22);
  doc.setTextColor(100, 200, 140);
  doc.setFontSize(14);
  doc.text(`Rs.${receipt.amount.toLocaleString("en-IN")}`, W - margin - 6, y + 22, { align: "right" });

  y += 40;

  // Receipt table
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 140, 160);
  doc.text("PAYMENT DETAILS", margin, y);
  y += 6;

  const rows = [
    ["Customer Name",  receipt.userName],
    ["Email Address",  receipt.userEmail],
    ["Date",           receipt.date],
    ["Plan",           receipt.planName],
    ["Amount Paid",    `Rs.${receipt.amount.toLocaleString("en-IN")}`],
    ["Payment ID",     receipt.paymentId],
    ["Order ID",       receipt.orderId],
  ];

  rows.forEach(([label, value], i) => {
    const bg = i % 2 === 0 ? [18, 28, 50] : [14, 22, 40];
    doc.setFillColor(...bg as [number, number, number]);
    doc.rect(margin, y, W - margin * 2, 9, "F");
    doc.setTextColor(140, 160, 185);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(label, margin + 4, y + 6);
    doc.setTextColor(210, 220, 235);
    doc.setFont("helvetica", i === 4 ? "bold" : "normal");
    doc.text(value, W - margin - 4, y + 6, { align: "right" });
    y += 9;
  });

  y += 16;

  // Footer
  doc.setDrawColor(40, 60, 90);
  doc.line(margin, y, W - margin, y);
  y += 8;
  doc.setTextColor(80, 100, 130);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("AgentVerse AI  ·  agentverse-ai-web.vercel.app", W / 2, y, { align: "center" });
  doc.text("This is a computer-generated receipt and does not require a signature.", W / 2, y + 6, { align: "center" });

  doc.save(`agentverse-receipt-${receipt.paymentId.slice(-8)}.pdf`);
}

function ReceiptModal({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    await downloadPDF(receipt).catch(() => {});
    setDownloading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md border border-sky-200/20 bg-[#0a0f1a] p-8 animate-fade-up">
        {/* Success icon */}
        <div className="mb-6 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center border border-emerald-400/30 bg-emerald-400/10 mx-auto">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="font-[var(--font-pixel)] text-lg text-white">Payment Successful</h2>
          <p className="mt-1 text-sm text-white/50">Your subscription is now active. A confirmation email has been sent.</p>
        </div>

        {/* Receipt lines */}
        <div className="space-y-0 border border-white/10 text-sm overflow-hidden">
          {[
            ["Plan",       receipt.planName],
            ["Date",       receipt.date],
            ["Email",      receipt.userEmail],
            ["Payment ID", receipt.paymentId],
            ["Order ID",   receipt.orderId],
          ].map(([label, value], i) => (
            <div key={label} className={`flex justify-between px-4 py-3 ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
              <span className="text-white/50 shrink-0">{label}</span>
              <span className="text-white/80 font-mono text-xs text-right ml-4 truncate max-w-[55%]">{value}</span>
            </div>
          ))}
          <div className="flex justify-between px-4 py-3 border-t border-white/10">
            <span className="text-white font-semibold">Amount Paid</span>
            <span className="font-[var(--font-pixel)] text-base text-sky-200">
              ₹{receipt.amount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 border border-sky-200/40 bg-sky-200/10 py-2.5 text-sm text-sky-200 hover:bg-sky-200/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {downloading ? (
              <><span className="h-3 w-3 border border-sky-200/40 border-t-sky-200 rounded-full animate-spin inline-block" /> Generating…</>
            ) : (
              <>⬇ Download PDF</>
            )}
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
    <div className={`pixel-panel flex flex-col p-5 sm:p-6 animate-fade-up ${plan.highlighted ? "border-sky-100/25 shadow-glow" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-[var(--font-pixel)] text-base sm:text-lg text-white">{plan.name}</p>
          {isCurrent && <span className="mt-1 inline-block border border-sky-200/30 px-2 py-0.5 text-[10px] text-sky-200">Current plan</span>}
        </div>
        <div className="text-right">
          <p className="font-[var(--font-pixel)] text-xl sm:text-2xl text-sky-200">₹{plan.monthlyPrice.toLocaleString("en-IN")}</p>
          <p className="text-[10px] uppercase tracking-widest text-white/35">/ month</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/55">{plan.description}</p>
      <div className="mt-5 space-y-2 flex-1">
        {plan.features.map((f) => (
          <div key={f} className="flex items-start gap-2 text-sm text-white/65">
            <span className="mt-0.5 text-sky-200 text-xs shrink-0">✓</span>
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
      toast("Razorpay not configured. Add NEXT_PUBLIC_RAZORPAY_KEY_ID to Vercel.", "error");
      setPaying(false);
      return;
    }

    setStatus("Opening checkout…");
    try {
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) throw new Error("Could not load Razorpay checkout");

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
      setStatus(null);
      toast(err instanceof Error ? err.message : "Checkout failed", "error");
      setPaying(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      {receipt && <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />}

      <div className="mb-8">
        <p className="section-label">Billing</p>
        <h1 className="mt-2 font-[var(--font-pixel)] text-2xl sm:text-3xl text-white">Choose your plan</h1>
        <p className="mt-2 text-sm text-white/55">
          Razorpay-powered billing. All plans include access to the AgentVerse API.
        </p>
      </div>

      {status && (
        <div className="mb-6 border border-sky-200/20 bg-sky-200/[0.05] px-4 py-3 text-sm text-sky-200 flex items-center gap-3">
          <span className="h-3 w-3 border border-sky-200/40 border-t-sky-200 rounded-full animate-spin shrink-0" />
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
          ⚠️ Razorpay not configured — add{" "}
          <code className="text-amber-200">NEXT_PUBLIC_RAZORPAY_KEY_ID</code> to Vercel env vars.
        </p>
      )}
    </main>
  );
}
