import CtaSection from "./components/CtaSection";
import FAQSection from "./components/FAQs";
import FooterSection from "./components/FooterSection";
import FourthSection from "./components/FourthSection";
import NavBar from "./components/NavBar";
import PricingSection from "./components/PricingSection";
import ProductDisplay from "./components/ProductDisplay";
import SecondSection from "./components/SecondSection";
import TestimonialSection from "./components/TestimonialSection";
import ThirdSection from "./components/ThirdSection";
import TopSection from "./components/TopSection";

const Home = () => {
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
};

export default Home;
