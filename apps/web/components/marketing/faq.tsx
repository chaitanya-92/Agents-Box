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
  }
];

export function FaqSection() {
  return (
    <section id="faq" className="border-t border-white/10 bg-black/25">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 space-y-4">
          <p className="section-label">FAQ</p>
          <h2 className="font-[var(--font-pixel)] text-3xl text-white sm:text-4xl">Clear architecture. Clear product boundaries.</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.question} className="pixel-panel p-6">
              <p className="font-[var(--font-pixel)] text-sm text-white">{faq.question}</p>
              <p className="mt-4 text-sm leading-7 text-white/68">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

