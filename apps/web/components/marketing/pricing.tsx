import { pricingPlans } from "@agentverse/config";
import { PaymentButton } from "@/components/marketing/payment-button";

export function PricingSection() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 space-y-4">
        <p className="section-label">Pricing</p>
        <h2 className="font-[var(--font-pixel)] text-3xl text-white sm:text-4xl">Subscription plans built for growth.</h2>
        <p className="max-w-3xl text-base leading-8 text-white/70">
          Razorpay-powered billing supports India-first payment collection and reliable entitlement sync.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {pricingPlans.map((plan) => (
          <div
            key={plan.id}
            className={`pixel-panel flex flex-col p-6 ${plan.highlighted ? "border-sky-100/35 shadow-glow" : ""}`}
          >
            <p className="font-[var(--font-pixel)] text-lg text-white">{plan.name}</p>
            <p className="mt-4 text-sm leading-7 text-white/65">{plan.description}</p>
            <div className="mt-6">
              <p className="font-[var(--font-pixel)] text-3xl text-sky-200">₹{plan.monthlyPrice}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/45">per month</p>
            </div>
            <div className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <div key={feature} className="border border-white/10 px-4 py-3 text-sm text-white/70">
                  {feature}
                </div>
              ))}
            </div>
            <PaymentButton plan={plan} highlighted={plan.highlighted} />
          </div>
        ))}
      </div>
    </section>
  );
}
