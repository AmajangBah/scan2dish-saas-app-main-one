"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Route from "../../constants/Route";

const CtaSection = ({
  isAuthenticated,
  dashboardHref,
}: {
  isAuthenticated: boolean;
  dashboardHref: string;
}) => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push(isAuthenticated ? dashboardHref : Route.SIGNUPPAGE);
  };

  return (
    <section className="relative min-h-screen bg-white pt-10 flex flex-col items-center justify-center px-4 md:px-0">
      {/* Heading + Description */}
      <div className="flex flex-col items-center text-center">
        <h2 className="mb-4 text-2xl sm:text-3xl font-bold text-[#D35A0F]">
          Let Your Customers Scan, Order, and Smile 😄
        </h2>

        <p className="w-full max-w-2xl leading-relaxed text-gray-700">
          Join dozens of restaurants using Scan2Dish to manage orders, tables,
          and sales — all from one easy-to-use dashboard.
        </p>

        <Button
          onClick={handleGetStarted}
          className="bg-[#D35A0F] hover:bg-[#B14A08] hover:scale-105 transition-all duration-300 rounded-md py-4 px-8 sm:py-6 sm:px-12 my-10 sm:my-20"
        >
          {isAuthenticated ? "Open Dashboard" : "Get Started Today"}
        </Button>

        {/* Star Icon (top-right) */}
        <Image
          src="/Star.svg"
          alt="Star"
          width={56}
          height={56}
          className="absolute top-6 right-6 w-10 sm:w-14 animate-spin-slow"
        />
      </div>
    </section>
  );
};

export default CtaSection;
