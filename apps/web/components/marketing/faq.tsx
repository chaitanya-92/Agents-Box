"use client";

import { useState } from "react";

const faqs = [
  {
    question: "Can I add new agents later without rewriting the app?",
    answer: "Yes. The platform uses a catalog-driven architecture so new agents can be registered through configuration and surfaced across the UI and API."
  },
  {
    question: "Does billing support subscriptions and webhook updates?",
    answer: "Yes. The backend includes subscription entities, Razorpay payment verification, and webhook handling to update status changes."
  },
  {
    question: "Is this ready for auth with email/password and Google login?",
    answer: "Yes. The architecture includes credential auth, JWT issuance, refresh token support, and Google OAuth integration hooks."
  },
  {
    question: "What happens when I run out of credits?",
    answer: "When your credits are exhausted you'll see an upgrade nudge in the dashboard. You can top up or switch to a higher plan at any time — your agents stay accessible."
  },
  {
    question: "Is there a free trial?",
    answer: "Yes. Every new account gets a 7-day Pro trial — no card required. You'll have access to all Pro agents and can upgrade before the trial ends to keep going."
  },
  {
    question: "Can I cancel my subscription?",
    answer: "Absolutely. You can cancel at any time from the Plans page. Your access continues until the end of the current billing period."
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="pixel-panel overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-white/[0.03]"
        aria-expanded={open}
      >
        <span className="font-[var(--font-pixel)] text-sm text-white leading-relaxed">{question}</span>
        <span
          className="shrink-0 text-sky-200 text-lg transition-transform duration-200"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
          aria-hidden
        >
          +
        </span>
      </button>

      <div
        style={{
          maxHeight: open ? "400px" : "0",
          opacity: open ? 1 : 0,
          transition: "max-height 0.3s ease, opacity 0.25s ease",
          overflow: "hidden",
        }}
      >
        <p className="px-6 pb-5 text-sm leading-7 text-white/60">{answer}</p>
      </div>
    </div>
  );
}

export function FaqSection() {
  return (
    <section id="faq" className="border-t border-white/10 bg-black/25">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 space-y-4">
          <p className="section-label">FAQ</p>
          <h2 className="font-[var(--font-pixel)] text-3xl text-white sm:text-4xl">
            Clear architecture. Clear product boundaries.
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
