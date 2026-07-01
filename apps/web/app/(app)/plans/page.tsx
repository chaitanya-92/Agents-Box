"use client";

import { useEffect, useRef, useState } from "react";
import { pricingPlans, type PricingPlan } from "@agentverse/config";
import {
  createPricingOrder, getBillingProfile, getMySubscription,
  type BillingProfile, type Subscription, verifyPricingPayment,
} from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { publicEnv } from "@/lib/env";
import { useToast } from "@/components/ui/toast";
import { BillingDetailsModal } from "@/components/billing/billing-details-modal";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jspdf?: any;
  }
}

type Receipt = {
  planName: string;
  amount: number;       // in rupees
  currency: string;
  orderId: string;
  paymentId: string;
  invoiceNumber?: string | null;
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

async function downloadPDF(receipt: Receipt, billing: BillingProfile | null) {
  const ok = await loadJsPDF();
  if (!ok || !window.jspdf) { window.print(); return; }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { jsPDF } = window.jspdf as any;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // ── Palette ───────────────────────────────────────────────────────────
  const navy  = [15, 23, 42];
  const blue  = [14, 165, 233];
  const dark  = [30, 41, 59];
  const grey  = [100, 116, 139];
  const light = [241, 245, 249];
  const green = [22, 163, 74];
  const W = 210, margin = 20;

  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, 297, "F");

  // ── Header bar ───────────────────────────────────────────────────────
  doc.setFillColor(...navy);
  doc.rect(0, 0, W, 42, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("AgentVerse AI", margin, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("One Platform. Unlimited AI Agents.", margin, 26);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("INVOICE", W - margin, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(receipt.date, W - margin, 26, { align: "right" });

  // ── Title + Invoice meta ───────────────────────────────────────────────
  let y = 52;
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("TAX INVOICE", margin, y);
  doc.setDrawColor(...blue);
  doc.setLineWidth(0.8);
  doc.line(margin, y + 3, margin + 46, y + 3);

  // Invoice number & date (top right)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...grey);
  doc.text("Invoice No.", W - margin - 55, y - 4);
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.text(receipt.invoiceNumber ?? "—", W - margin, y - 4, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grey);
  doc.text("Invoice Date", W - margin - 55, y + 3);
  doc.setTextColor(...dark);
  doc.text(receipt.date, W - margin, y + 3, { align: "right" });

  // SAC Code
  doc.setTextColor(...grey);
  doc.setFontSize(7.5);
  doc.text("SAC Code: 998315 (SaaS / Cloud Software Services)", W - margin, y + 10, { align: "right" });

  y += 18;

  // ── Billed from (seller) + Billed to (buyer) side by side ─────────────
  const col2 = W / 2 + 4;

  // FROM
  doc.setTextColor(...grey);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("FROM", margin, y);
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("AgentVerse AI", margin, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grey);
  doc.text("agentverse.ai", margin, y + 14);
  doc.text("support@agentverse.ai", margin, y + 20);

  // TO
  doc.setTextColor(...grey);
  doc.setFontSize(7.5);
  doc.text("BILLED TO", col2, y);
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(billing?.companyName ?? receipt.userName, col2, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grey);
  doc.text(receipt.userName, col2, y + 14);
  doc.text(receipt.userEmail, col2, y + 20);
  if (billing?.phone) doc.text(billing.phone, col2, y + 26);
  y += 34;

  // Address block
  if (billing) {
    const addr = [
      billing.addressLine1,
      billing.addressLine2,
      `${billing.city}, ${billing.state} - ${billing.pinCode}`,
    ].filter(Boolean).join(", ");
    doc.setFontSize(8);
    doc.setTextColor(...grey);
    const addrLines = doc.splitTextToSize(addr, 80) as string[];
    addrLines.forEach((line: string, i: number) => {
      doc.text(line, col2, y + i * 5);
    });
    y += addrLines.length * 5 + 4;
    if (billing.gstin) {
      doc.setTextColor(...dark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(`GSTIN: ${billing.gstin}`, col2, y);
      y += 5;
    }
    if (billing.pan) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...grey);
      doc.text(`PAN: ${billing.pan}`, col2, y);
      y += 5;
    }
  }
  y += 6;

  // ── Line item table ────────────────────────────────────────────────────
  // GST calculation: amount is base + 18% GST included (reverse calc)
  const totalPaid = receipt.amount;
  const baseAmt   = Math.round((totalPaid / 1.18) * 100) / 100;
  const gstAmt    = Math.round((totalPaid - baseAmt) * 100) / 100;
  const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  // Table header
  const c0 = margin;
  const c1 = margin + 80;
  const c2 = margin + 102;
  const c3 = margin + 124;
  const c4 = margin + 146;
  const colX = [c0, c1, c2, c3, c4];
  const rowH = 9;

  doc.setFillColor(...navy);
  doc.rect(margin, y, W - margin * 2, rowH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  ["Description", "HSN/SAC", "Rate", "GST 18%", "Amount"].forEach((h, i) => {
    doc.text(h, colX[i]! + 2, y + 6);
  });
  y += rowH;

  // Row 1
  doc.setFillColor(...light);
  doc.rect(margin, y, W - margin * 2, rowH, "F");
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`${receipt.planName} Plan — Monthly`, c0 + 2, y + 6);
  doc.text("998315", c1 + 2, y + 6);
  doc.text(fmt(baseAmt), c2 + 2, y + 6);
  doc.text(fmt(gstAmt), c3 + 2, y + 6);
  doc.setFont("helvetica", "bold");
  doc.text(fmt(totalPaid), c4 + 2, y + 6);
  y += rowH;

  // Subtotals
  const subRows: [string, string][] = [
    ["Subtotal (Base)", fmt(baseAmt)],
    ["IGST @ 18%",      fmt(gstAmt)],
  ];
  subRows.forEach(([label, val]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...grey);
    doc.text(label, W - margin - 60, y + 6);
    doc.setTextColor(...dark);
    doc.text(val, W - margin - 4, y + 6, { align: "right" });
    y += 9;
  });

  // ── Total box ─────────────────────────────────────────────────────────
  y += 2;
  doc.setFillColor(...blue);
  doc.rect(margin, y, W - margin * 2, 13, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL PAID (incl. GST)", margin + 4, y + 9);
  doc.setFontSize(12);
  doc.text(fmt(totalPaid), W - margin - 4, y + 9, { align: "right" });

  // Payment reference
  y += 18;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grey);
  doc.text(`Payment ID: ${receipt.paymentId}`, margin, y);
  doc.text(`Order ID: ${receipt.orderId}`, margin, y + 6);
  doc.setTextColor(...green);
  doc.setFont("helvetica", "bold");
  doc.text("STATUS: PAID", W - margin, y, { align: "right" });

  // ── Footer ────────────────────────────────────────────────────────────
  doc.setDrawColor(...light);
  doc.setLineWidth(0.5);
  doc.line(margin, 272, W - margin, 272);
  doc.setTextColor(...grey);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Thank you for choosing AgentVerse AI.", margin, 279);
  doc.text("For support: support@agentverse.ai", margin, 285);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...blue);
  doc.text("agentverse.ai", W - margin, 285, { align: "right" });

  doc.save(`agentverse-receipt-${receipt.paymentId.slice(-8)}.pdf`);
}

function ReceiptModal({ receipt, billing, onClose }: { receipt: Receipt; billing: BillingProfile | null; onClose: () => void }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    await downloadPDF(receipt, billing).catch(() => {});
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
  const [billingModal, setBillingModal] = useState<{ plan: PricingPlan } | null>(null);
  const [billingProfile, setBillingProfile] = useState<BillingProfile | null>(null);
  const paymentHandled = useRef(false);

  useEffect(() => {
    getMySubscription().then((r) => setSub(r.data)).catch(() => setSub(null));
    getBillingProfile().then((r) => setBillingProfile(r.data)).catch(() => {});
  }, []);

  async function handlePay(plan: PricingPlan) {
    if (paying) return;
    const user = getCurrentUser();
    if (!user) { window.location.href = "/login"; return; }
    // Show billing details modal first
    setBillingModal({ plan });
  }

  async function openRazorpay(plan: PricingPlan, billing: BillingProfile) {
    if (paying) return;
    paymentHandled.current = false;
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
        prefill: { name: user.name, email: user.email, contact: billing.phone },
        theme: { color: "#b9e6ff" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // Guard against Razorpay calling handler more than once
          if (paymentHandled.current) return;
          paymentHandled.current = true;
          setStatus("Verifying payment…");
          try {
            const verified = await verifyPricingPayment({
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              invoiceNumber: (verified as any)?.data?.invoiceNumber ?? null,
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
      {receipt && <ReceiptModal receipt={receipt} billing={billingProfile} onClose={() => setReceipt(null)} />}
      {billingModal && (
        <BillingDetailsModal
          initial={billingProfile}
          userName={getCurrentUser()?.name ?? ""}
          userEmail={getCurrentUser()?.email ?? ""}
          onConfirm={(profile) => {
            setBillingProfile(profile);
            setBillingModal(null);
            openRazorpay(billingModal.plan, profile);
          }}
          onClose={() => setBillingModal(null)}
        />
      )}

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
