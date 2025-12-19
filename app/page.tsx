import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { IntegrationsSection } from "@/components/landing/IntegrationsSection";
import { InsightsSection } from "@/components/landing/InsightsSection";
import { RevenueTrackingSection } from "@/components/landing/RevenueTrackingSection";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { PricingSection } from "@/components/landing/pricing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="antialiased font-sans bg-stone-50">
      <div className="w-full flex flex-col items-center">
        <Navbar />
        <div className="max-w-6xl w-full border-x border-stone-200 flex flex-col bg-transparent">
          <HeroSection />
          <DashboardPreview />
          <FeatureCards />
        </div>
        <div className="max-w-6xl w-full border-x border-stone-200 bg-stone-50">
          <IntegrationsSection />
        </div>
        <div className="max-w-6xl w-full border-x border-stone-200 bg-transparent">
          <InsightsSection />
          <RevenueTrackingSection />
          <FeaturesGrid />
          <PricingSection />
          <TestimonialsSection />
          <CTASection />
          <Footer />
        </div>
      </div>
    </div>
  );
}
