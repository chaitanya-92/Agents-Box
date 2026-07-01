import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata = { title: "Privacy Policy — AgentVerse AI" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <p className="section-label">Legal</p>
        <h1 className="mt-4 font-[var(--font-pixel)] text-3xl text-white mb-8">Privacy Policy</h1>

        <div className="space-y-8 text-sm text-white/65 leading-7">
          <p className="text-xs text-white/35">Last updated: 1 July 2026</p>

          {[
            {
              title: "1. Information We Collect",
              body: `We collect information you provide directly (name, email, phone), usage data (agent invocations, timestamps), payment information processed through Razorpay, and technical data (IP address, browser type, device info).`
            },
            {
              title: "2. How We Use Your Information",
              body: `We use collected information to provide and improve the Service, process payments, send transactional emails (receipts, verification, password reset), and analyse usage patterns to enhance the platform. We do not sell your personal data.`
            },
            {
              title: "3. Data Storage and Security",
              body: `Your data is stored securely on Supabase PostgreSQL. All connections use TLS/SSL. Passwords are hashed using bcrypt. API keys are stored as SHA-256 hashes. We follow industry-standard security practices.`
            },
            {
              title: "4. Third-Party Services",
              body: `We use Razorpay for payment processing, Render for API hosting, Vercel for frontend hosting, and Gmail SMTP for transactional email. Each service has its own privacy policy governing their data use.`
            },
            {
              title: "5. Cookies",
              body: `We use localStorage (not cookies) to store authentication tokens client-side. We do not use advertising or tracking cookies.`
            },
            {
              title: "6. Data Retention",
              body: `We retain your account data for as long as your account is active. After account deletion, personal data is removed within 30 days. Payment records may be retained longer for legal compliance.`
            },
            {
              title: "7. Your Rights",
              body: `You may request access to, correction of, or deletion of your personal data at any time by contacting us at support@agentverse.ai. You can update your profile and email preferences directly in the app.`
            },
            {
              title: "8. Children's Privacy",
              body: `The Service is not intended for users under 13 years of age. We do not knowingly collect data from children.`
            },
            {
              title: "9. Changes to This Policy",
              body: `We may update this Privacy Policy periodically. We'll notify you by email or via the app for material changes.`
            },
            {
              title: "10. Contact",
              body: `For privacy-related enquiries, email us at support@agentverse.ai.`
            },
          ].map(({ title, body }) => (
            <div key={title}>
              <h2 className="text-base font-semibold text-white mb-2">{title}</h2>
              <p>{body}</p>
            </div>
          ))}

          <div className="border-t border-white/10 pt-6">
            <Link href="/terms" className="text-sky-200 hover:text-sky-100 transition text-sm">
              Read our Terms of Service →
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
