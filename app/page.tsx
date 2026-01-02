import CtaSection from "./components/marketing/CtaSection";
import FAQSection from "./components/marketing/FAQs";
import FooterSection from "./components/marketing/FooterSection";
import FourthSection from "./components/marketing/FourthSection";
import NavBar from "./components/marketing/NavBar";
import PricingSection from "./components/marketing/PricingSection";
import ProductDisplay from "./components/marketing/ProductDisplay";
import SecondSection from "./components/marketing/SecondSection";
import TestimonialSection from "./components/marketing/TestimonialSection";
import ThirdSection from "./components/marketing/ThirdSection";
import TopSection from "./components/marketing/TopSection";
import { getAdminUser } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getRestaurantAuthContext } from "@/lib/auth/restaurant";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;

  let dashboardHref = "/dashboard";
  if (user) {
    const adminUser = await getAdminUser();
    if (adminUser) {
      dashboardHref = "/admin";
    } else {
      const restaurantCtx = await getRestaurantAuthContext();
      dashboardHref = restaurantCtx?.onboardingCompleted ? "/dashboard" : "/onboarding";
    }
  }

  return (
    <main className="scroll-smooth">
      <NavBar isAuthenticated={isAuthenticated} dashboardHref={dashboardHref} />
      {/* Hero Section */}
      <header className="min-h-screen bg-[#D35A0F] px-6">
        <TopSection isAuthenticated={isAuthenticated} dashboardHref={dashboardHref} />
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
        <CtaSection isAuthenticated={isAuthenticated} dashboardHref={dashboardHref} />
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

