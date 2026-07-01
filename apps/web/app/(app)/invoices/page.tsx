"use client";

import { useEffect, useState } from "react";
import { getInvoices, getProfile, type Invoice, type UserProfile } from "@/lib/api";
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

// Format amount — jsPDF built-in fonts don't support ₹, use "Rs." instead
function fmtAmount(paise: number) {
  return `Rs. ${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function downloadInvoicePDF(invoice: Invoice, profile: UserProfile | null) {
  loadJsPDF().then((JsPDF) => {
    if (!JsPDF) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = new (JsPDF as any)({ unit: "mm", format: "a4" });

    // ── Palette (white bg, dark text) ────────────────────────────────────
    const navy   = [15, 23, 42];    // header bg
    const blue   = [14, 165, 233];  // accent
    const dark   = [30, 41, 59];    // strong text
    const grey   = [100, 116, 139]; // muted text
    const light  = [241, 245, 249]; // zebra row bg
    const green  = [22, 163, 74];   // PAID badge

    const pageW = 210;
    const margin = 20;

    // White background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, 297, "F");

    // ── Header bar ───────────────────────────────────────────────────────
    doc.setFillColor(...navy);
    doc.rect(0, 0, pageW, 42, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("AgentVerse AI", margin, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("One Platform. Unlimited AI Agents.", margin, 26);

    // INVOICE label top-right
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("INVOICE", pageW - margin, 18, { align: "right" });

    const date = new Date(invoice.createdAt).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric"
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(date, pageW - margin, 26, { align: "right" });

    // ── Title ─────────────────────────────────────────────────────────────
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Payment Receipt", margin, 60);

    // Accent underline
    doc.setDrawColor(...blue);
    doc.setLineWidth(0.8);
    doc.line(margin, 63, margin + 55, 63);

    // ── Billed to ─────────────────────────────────────────────────────────
    let y = 76;
    if (profile) {
      doc.setTextColor(...grey);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("BILLED TO", margin, y);

      doc.setTextColor(...dark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(profile.name, margin, y + 7);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...grey);
      doc.text(profile.email, margin, y + 14);
      if (profile.phone) doc.text(profile.phone, margin, y + 20);
      y += 32;
    }

    // ── Receipt table ─────────────────────────────────────────────────────
    y += 4;
    const rows: [string, string][] = [
      ["Description", "Subscription — AgentVerse AI"],
      ["Payment ID",  invoice.razorpayPaymentId ?? "—"],
      ["Order ID",    invoice.razorpayOrderId ?? "—"],
      ["Date",        date],
      ["Status",      "PAID"],
    ];

    // Table header
    doc.setFillColor(...navy);
    doc.rect(margin, y, pageW - margin * 2, 9, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("FIELD", margin + 4, y + 6);
    doc.text("DETAILS", pageW - margin - 4, y + 6, { align: "right" });
    y += 9;

    rows.forEach(([label, value], i) => {
      const rowH = 10;
      // Zebra
      if (i % 2 === 0) {
        doc.setFillColor(...light);
        doc.rect(margin, y, pageW - margin * 2, rowH, "F");
      }
      doc.setTextColor(...grey);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(label, margin + 4, y + 6.5);

      // PAID badge in green
      if (label === "Status") {
        doc.setTextColor(...green);
        doc.setFont("helvetica", "bold");
      } else {
        doc.setTextColor(...dark);
        doc.setFont("helvetica", "normal");
      }
      doc.text(value, pageW - margin - 4, y + 6.5, { align: "right" });
      y += rowH;
    });

    // ── Total box ─────────────────────────────────────────────────────────
    y += 6;
    doc.setFillColor(...blue);
    doc.rect(margin, y, pageW - margin * 2, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL PAID", margin + 4, y + 9.5);
    doc.setFontSize(13);
    doc.text(fmtAmount(invoice.amount), pageW - margin - 4, y + 9.5, { align: "right" });

    // ── Footer ────────────────────────────────────────────────────────────
    doc.setDrawColor(...light);
    doc.setLineWidth(0.5);
    doc.line(margin, 272, pageW - margin, 272);

    doc.setTextColor(...grey);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Thank you for choosing AgentVerse AI.", margin, 279);
    doc.text("For support: support@agentverse.ai", margin, 285);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...blue);
    doc.text("agentverse.ai", pageW - margin, 285, { align: "right" });

    const filename = `agentverse_receipt_${invoice.razorpayPaymentId ?? invoice.id}.pdf`;
    doc.save(filename);
  });
}

export default function InvoicesPage() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getInvoices().then((r) => setInvoices(r.data)),
      getProfile().then((r) => setProfile(r.data)).catch(() => {}),
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
                    onClick={() => downloadInvoicePDF(inv, profile)}
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
