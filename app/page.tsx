import CtaSection from "./[locale]/components/CtaSection";
import FAQSection from "./[locale]/components/FAQs";
import FooterSection from "./[locale]/components/FooterSection";
import FourthSection from "./[locale]/components/FourthSection";
import NavBar from "./[locale]/components/NavBar";
import PricingSection from "./[locale]/components/PricingSection";
import ProductDisplay from "./[locale]/components/ProductDisplay";
import SecondSection from "./[locale]/components/SecondSection";
import TestimonialSection from "./[locale]/components/TestimonialSection";
import ThirdSection from "./[locale]/components/ThirdSection";
import TopSection from "./[locale]/components/TopSection";

export default function Home() {
  return (
    <main className="scroll-smooth">
      <NavBar />
      {/* Hero Section */}
      <header className="min-h-screen bg-[#D35A0F] px-6">
        <TopSection />
      </header>

      {/* Features Section */}
      <section id="features">
        <SecondSection />
        <ThirdSection />
        <FourthSection />
      </section>

      {/* Social Proof */}
      <section>
        <TestimonialSection />
      </section>

      {/* Pricing Section */}
      <section id="pricing">
        <PricingSection />
      </section>

      {/* Product Display */}
      <section>
        <ProductDisplay />
      </section>

      {/* CTA Section */}
      <section>
        <CtaSection />
      </section>

      {/* FAQ Section */}
      <section id="faq">
        <FAQSection />
      </section>

      {/* Footer */}
      <footer>
        <FooterSection />
      </footer>
    </main>
  );
}

