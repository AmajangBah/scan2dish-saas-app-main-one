"use client";

import { useRouter } from "next/navigation";
import PriceCard from "./PriceCard";
import Route from "../../constants/Route";

const PricingSection = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push(Route.SIGNUPPAGE);
  };

  return (
    <section className="relative min-h-screen bg-white pt-5 my-6 flex flex-col items-center justify-center px-4 md:px-0">
      {/* Heading + Description */}
      <div className="flex flex-col items-center text-center">
        <h2 className="mb-4 text-3xl font-bold text-[#D35A0F]">
          Same tools. Same power. Just pay as you grow.
        </h2>

        <p className="w-full max-w-2xl leading-relaxed text-gray-700">
          Every restaurant gets full access to Scan2Dish — we only charge a
          small commission on each order. No monthly fees. No hidden limits.
        </p>
      </div>

      {/* Pricing Card */}
      <div className="mt-10 flex flex-col items-center gap-6 w-full max-w-md">
        <PriceCard
          heading="Pay-as-you-serve"
          description="We grow when you grow - it's that simple. Only pay when customers order"
          price="5%"
          exampleText="Example: earn ₦1M this month, pay ₦50K in commission."
          buttonText="Get started today"
          buttonColor="#D65A00"
          starImageUrl="/Star.svg"
          onButtonClick={handleGetStarted}
        />
      </div>
    </section>
  );
};

export default PricingSection;
