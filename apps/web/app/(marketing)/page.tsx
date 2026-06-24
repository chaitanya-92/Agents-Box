import { AgentsCarousel } from "@/components/marketing/agents-carousel";
import { FaqSection } from "@/components/marketing/faq";
import { Hero } from "@/components/marketing/hero";
import { PlatformGrid } from "@/components/marketing/platform-grid";
import { PricingSection } from "@/components/marketing/pricing";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function MarketingPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <Hero />
      <PlatformGrid />
      <AgentsCarousel />
      <PricingSection />
      <FaqSection />
      <SiteFooter />
    </main>
  );
}

