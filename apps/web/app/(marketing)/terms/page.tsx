import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata = { title: "Terms of Service — AgentVerse AI" };

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <p className="section-label">Legal</p>
        <h1 className="mt-4 font-[var(--font-pixel)] text-3xl text-white mb-8">Terms of Service</h1>

        <div className="prose-dark space-y-8 text-sm text-white/65 leading-7">
          <div>
            <p className="text-xs text-white/35 mb-6">Last updated: 1 July 2026</p>
          </div>

          {[
            {
              title: "1. Acceptance of Terms",
              body: `By accessing or using AgentVerse AI ("Service"), you agree to be bound by these Terms. If you do not agree, do not use the Service.`
            },
            {
              title: "2. Account Registration",
              body: `You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account.`
            },
            {
              title: "3. Subscriptions and Billing",
              body: `AgentVerse AI offers monthly subscription plans. All fees are charged in advance. Subscriptions auto-renew until cancelled. Refunds are not provided for partial billing periods. Prices may change with 30 days' notice.`
            },
            {
              title: "4. Free Trial",
              body: `New accounts receive a 7-day Pro trial. No payment method is required during the trial. At the end of the trial period, you must upgrade to a paid plan to retain access to Pro features.`
            },
            {
              title: "5. Acceptable Use",
              body: `You agree not to use the Service to violate any law, infringe intellectual property, generate harmful or deceptive content, or interfere with the platform's operation. We reserve the right to suspend accounts that violate this policy.`
            },
            {
              title: "6. Intellectual Property",
              body: `The AgentVerse AI platform, its design, code, and content are owned by AgentVerse AI and are protected by applicable intellectual property laws. You retain ownership of content you create using the Service.`
            },
            {
              title: "7. Limitation of Liability",
              body: `The Service is provided "as is." To the fullest extent permitted by law, AgentVerse AI shall not be liable for indirect, incidental, or consequential damages arising from use of the Service.`
            },
            {
              title: "8. Termination",
              body: `We may terminate or suspend your account at any time for violation of these Terms. You may cancel your subscription at any time from your account settings.`
            },
            {
              title: "9. Changes to Terms",
              body: `We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the new Terms.`
            },
            {
              title: "10. Contact",
              body: `For questions about these Terms, contact us at support@agentverse.ai.`
            },
          ].map(({ title, body }) => (
            <div key={title}>
              <h2 className="text-base font-semibold text-white mb-2">{title}</h2>
              <p>{body}</p>
            </div>
          ))}

          <div className="border-t border-white/10 pt-6">
            <Link href="/privacy" className="text-sky-200 hover:text-sky-100 transition text-sm">
              Read our Privacy Policy →
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
