"use client";

import { useEffect, useState } from "react";
import { getBillingProfile, getInvoices, getProfile, type BillingProfile, type Invoice, type UserProfile } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

async function loadJsPDF() {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, { jsPDF: unknown } | undefined>;
  if (w.jspdf) return w.jspdf?.jsPDF ?? null;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return (window as unknown as Record<string, { jsPDF: unknown }>).jspdf?.jsPDF ?? null;
}

const fmt = (rs: number) => `Rs. ${rs.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

function downloadInvoicePDF(invoice: Invoice, profile: UserProfile | null, billing: BillingProfile | null) {
  loadJsPDF().then((JsPDF) => {
    if (!JsPDF) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = new (JsPDF as any)({ unit: "mm", format: "a4" });

    const navy  = [15, 23, 42];
    const blue  = [14, 165, 233];
    const dark  = [30, 41, 59];
    const grey  = [100, 116, 139];
    const light = [241, 245, 249];
    const green = [22, 163, 74];
    const W = 210, margin = 20;

    // White bg
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, 297, "F");

    // Header bar
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

    const date = new Date(invoice.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    // Title + invoice meta
    let y = 52;
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("TAX INVOICE", margin, y);
    doc.setDrawColor(...blue);
    doc.setLineWidth(0.8);
    doc.line(margin, y + 3, margin + 46, y + 3);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...grey);
    doc.text("Invoice No.", W - margin - 55, y - 4);
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.invoiceNumber ?? "—", W - margin, y - 4, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grey);
    doc.text("Invoice Date", W - margin - 55, y + 3);
    doc.setTextColor(...dark);
    doc.text(date, W - margin, y + 3, { align: "right" });
    doc.setFontSize(7.5);
    doc.setTextColor(...grey);
    doc.text("SAC Code: 998315 (SaaS / Cloud Software Services)", W - margin, y + 10, { align: "right" });
    y += 18;

    // From / To
    const col2 = W / 2 + 4;
    doc.setFontSize(7.5);
    doc.setTextColor(...grey);
    doc.setFont("helvetica", "normal");
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

    doc.setFontSize(7.5);
    doc.setTextColor(...grey);
    doc.text("BILLED TO", col2, y);
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(billing?.companyName ?? profile?.name ?? "—", col2, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...grey);
    if (profile?.name) doc.text(profile.name, col2, y + 14);
    if (profile?.email) doc.text(profile.email, col2, y + 20);
    if (billing?.phone ?? profile?.phone) doc.text((billing?.phone ?? profile?.phone)!, col2, y + 26);
    y += 34;

    if (billing) {
      const addr = [billing.addressLine1, billing.addressLine2, `${billing.city}, ${billing.state} - ${billing.pinCode}`].filter(Boolean).join(", ");
      const addrLines = doc.splitTextToSize(addr, 80) as string[];
      addrLines.forEach((line: string, i: number) => doc.text(line, col2, y + i * 5));
      y += addrLines.length * 5 + 4;
      if (billing.gstin) {
        doc.setTextColor(...dark);
        doc.setFont("helvetica", "bold");
        doc.text(`GSTIN: ${billing.gstin}`, col2, y);
        y += 5;
      }
      if (billing.pan) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...grey);
        doc.text(`PAN: ${billing.pan}`, col2, y);
        y += 5;
      }
    }
    y += 6;

    // GST breakdown (amount stored in paise)
    const totalPaid = invoice.amount / 100;
    const baseAmt   = Math.round((totalPaid / 1.18) * 100) / 100;
    const gstAmt    = Math.round((totalPaid - baseAmt) * 100) / 100;

    let meta: Record<string, string> = {};
    try { meta = JSON.parse(invoice.metadata ?? "{}"); } catch {}
    const planName = meta.planName ?? "Subscription";

    // Line item header
    const ic0 = margin, ic1 = margin + 80, ic2 = margin + 102, ic3 = margin + 124, ic4 = margin + 146;
    const colX = [ic0, ic1, ic2, ic3, ic4];
    const rowH = 9;
    doc.setFillColor(...navy);
    doc.rect(margin, y, W - margin * 2, rowH, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    (["Description", "HSN/SAC", "Rate", "GST 18%", "Amount"] as const).forEach((h, i) => doc.text(h, colX[i] + 2, y + 6));
    y += rowH;

    // Line item row
    doc.setFillColor(...light);
    doc.rect(margin, y, W - margin * 2, rowH, "F");
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(`${planName} Plan — Monthly`, ic0 + 2, y + 6);
    doc.text("998315", ic1 + 2, y + 6);
    doc.text(fmt(baseAmt), ic2 + 2, y + 6);
    doc.text(fmt(gstAmt), ic3 + 2, y + 6);
    doc.setFont("helvetica", "bold");
    doc.text(fmt(totalPaid), ic4 + 2, y + 6);
    y += rowH;

    // Subtotals
    [["Subtotal (Base)", fmt(baseAmt)], ["IGST @ 18%", fmt(gstAmt)]].forEach(([label, val]) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...grey);
      doc.text(label, W - margin - 60, y + 6);
      doc.setTextColor(...dark);
      doc.text(val, W - margin - 4, y + 6, { align: "right" });
      y += 9;
    });

    // Total box
    y += 2;
    doc.setFillColor(...blue);
    doc.rect(margin, y, W - margin * 2, 13, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TOTAL PAID (incl. GST)", margin + 4, y + 9);
    doc.setFontSize(12);
    doc.text(fmt(totalPaid), W - margin - 4, y + 9, { align: "right" });

    // Payment ref
    y += 18;
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grey);
    doc.text(`Payment ID: ${invoice.razorpayPaymentId ?? "—"}`, margin, y);
    doc.text(`Order ID: ${invoice.razorpayOrderId ?? "—"}`, margin, y + 6);
    doc.setTextColor(...green);
    doc.setFont("helvetica", "bold");
    doc.text("STATUS: PAID", W - margin, y, { align: "right" });

    // Footer
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

    const filename = `agentverse_invoice_${invoice.invoiceNumber ?? invoice.razorpayPaymentId ?? invoice.id}.pdf`;
    doc.save(filename);
  });
}

export default function InvoicesPage() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [billing, setBilling] = useState<BillingProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getInvoices().then((r) => setInvoices(r.data)),
      getProfile().then((r) => setProfile(r.data)).catch(() => {}),
      getBillingProfile().then((r) => setBilling(r.data)).catch(() => {}),
    ])
      .catch(() => toast("Could not load invoices", "error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8">
        <p className="section-label">Billing</p>
        <h1 className="mt-2 font-[var(--font-pixel)] text-2xl sm:text-3xl text-white">Invoice History</h1>
        <p className="mt-2 text-sm text-white/55">Download PDF receipts for all your payments.</p>
      </div>

      <div className="pixel-panel divide-y divide-white/[0.07]">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2 w-40" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          ))
        ) : invoices.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm text-white/40">No payments yet.</p>
            <p className="mt-1 text-xs text-white/25">Your receipts will appear here after your first purchase.</p>
          </div>
        ) : (
          invoices.map((inv) => {
            let meta: Record<string, string> = {};
            try { meta = JSON.parse(inv.metadata ?? "{}"); } catch {}
            return (
              <div key={inv.id} className="flex items-center justify-between px-5 py-4 gap-4">
                <div>
                  <p className="text-sm text-white">
                    {meta.planName ?? "Subscription"} —{" "}
                    <span className="text-sky-200 font-medium">₹{inv.amount.toLocaleString("en-IN")}</span>
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-white/40">
                    {inv.razorpayPaymentId ?? inv.id}
                  </p>
                  <p className="mt-0.5 text-xs text-white/30">
                    {new Date(inv.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">PAID</span>
                  <button
                    onClick={() => downloadInvoicePDF(inv, profile, billing)}
                    className="border border-white/15 px-3 py-1.5 text-xs text-white/60 hover:border-sky-200/30 hover:text-sky-200 transition"
                  >
                    PDF ↓
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
