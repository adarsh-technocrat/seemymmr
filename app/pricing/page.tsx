import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { PricingPageContent } from "@/components/landing/PricingPageContent";

export default function PricingPage() {
  return (
    <div className="flex flex-col w-full items-center min-h-screen bg-stone-50">
      <Header />
      <main className="items-center w-full max-w-4xl border-x border-stone-200 flex flex-col gap-20 lg:gap-30 bg-white">
        <PricingPageContent />
      </main>
      <Footer />
    </div>
  );
}
