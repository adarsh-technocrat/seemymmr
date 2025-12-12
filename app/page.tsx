import {
  Header,
  HeroSection,
  DashboardSection,
  TestimonialSection,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <DashboardSection />
        <TestimonialSection />
      </main>
      <Footer />
    </>
  );
}
