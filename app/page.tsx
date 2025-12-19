import {
  Header,
  HeroSection,
  DashboardPreview,
  FeatureCards,
  IntegrationsSection,
  InsightsSection,
  RevenueTrackingSection,
  FeaturesGrid,
  PricingSection,
  TestimonialsSection,
  CTASection,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <div className="antialiased font-sans bg-stone-50">
      <div className="w-full flex flex-col items-center">
        <Header />
        <div className="max-w-6xl w-full border-x border-stone-200 flex flex-col bg-white">
          <HeroSection />
          <DashboardPreview />
          <FeatureCards />
        </div>
        <div className="max-w-6xl w-full border-x border-stone-200 bg-stone-50">
          <IntegrationsSection />
        </div>
        <div className="max-w-6xl w-full border-x border-stone-200 bg-white">
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
