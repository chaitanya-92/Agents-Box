import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm text-white/55">
          <p>AgentVerse AI. One Platform. Unlimited AI Agents.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/terms" className="hover:text-white/80 transition">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white/80 transition">Privacy Policy</Link>
            <span className="hidden sm:inline text-white/20">|</span>
            <span>Built with Next.js, Express, Prisma &amp; Razorpay.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

