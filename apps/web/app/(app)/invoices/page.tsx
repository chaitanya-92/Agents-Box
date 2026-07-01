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

function downloadInvoicePDF(invoice: Invoice, profile: UserProfile | null) {
  loadJsPDF().then((JsPDF) => {
    if (!JsPDF) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = new (JsPDF as any)({ unit: "mm", format: "a4" });

    const bg = [8, 10, 13];
    const accent = [186, 230, 255];
    const muted = [100, 110, 130];
    const white = [226, 232, 240];

    doc.setFillColor(...bg);
    doc.rect(0, 0, 210, 297, "F");

    doc.setFillColor(13, 20, 36);
    doc.rect(0, 0, 210, 48, "F");

    doc.setTextColor(...accent);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("AGENTVERSE AI", 20, 22);

    doc.setTextColor(...muted);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("One Platform. Unlimited AI Agents.", 20, 30);
    doc.text("INVOICE", 170, 22);

    doc.setTextColor(...white);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Receipt", 20, 62);

    const date = new Date(invoice.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    doc.setTextColor(...muted);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(date, 20, 70);

    if (profile) {
      doc.setTextColor(...white);
      doc.setFontSize(10);
      doc.text(profile.name, 20, 84);
      doc.setTextColor(...muted);
      doc.setFontSize(9);
      doc.text(profile.email, 20, 90);
      if (profile.phone) doc.text(profile.phone, 20, 96);
    }

    const rows = [
      ["Subscription", `₹${invoice.amount.toLocaleString("en-IN")}`],
      ["Payment ID", invoice.razorpayPaymentId ?? "—"],
      ["Order ID", invoice.razorpayOrderId ?? "—"],
      ["Date", date],
      ["Status", "PAID"],
    ];

    let y = 110;
    rows.forEach(([label, value], i) => {
      if (i % 2 === 0) {
        doc.setFillColor(18, 26, 46);
        doc.rect(20, y - 5, 170, 10, "F");
      }
      doc.setTextColor(...muted);
      doc.setFontSize(9);
      doc.text(label, 25, y);
      doc.setTextColor(...white);
      doc.text(value, 140, y, { align: "right" });
      y += 12;
    });

    doc.setDrawColor(...accent);
    doc.setLineWidth(0.4);
    doc.line(20, y + 2, 190, y + 2);

    doc.setTextColor(...accent);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: ₹${invoice.amount.toLocaleString("en-IN")}`, 190, y + 10, { align: "right" });

    doc.setTextColor(...muted);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for your business!", 20, 270);
    doc.text("AgentVerse AI", 20, 276);

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
