"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Route from "../../constants/Route";

const TopSection = ({
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

  const handleSeeHowItWorks = () => {
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="flex flex-col md:flex-row items-center justify-between relative px-6 md:px-20 py-10">
      <div className="gap-4 flex flex-col justify-between text-center md:text-left md:max-w-lg">
        <h1 className="text-4xl sm:text-5xl text-white font-bold mb-6 md:mb-10 animate-in fade-in slide-in-from-left duration-700">
          Let Guests Order Without Waiting for a Waiter..
        </h1>
        <p className="text-xl sm:text-2xl text-white mb-6 md:mb-4 animate-in fade-in slide-in-from-left duration-700 delay-150">
          <span className="font-bold">Scan. Order. Eat.</span> The modern way to
          dine — faster, smarter, and built for restaurants that actually get
          it.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-6 md:pt-10 justify-center md:justify-start animate-in fade-in slide-in-from-left duration-700 delay-300">
          <Button
            onClick={handleGetStarted}
            className="bg-white rounded-md text-black hover:bg-gray-100 hover:scale-105 transition-all duration-300 px-6 py-4"
          >
            {isAuthenticated ? "Go to Dashboard" : "Get Started Now"}
          </Button>
          <Button
            onClick={handleSeeHowItWorks}
            className="bg-transparent border border-white text-white rounded-md hover:bg-white hover:text-[#D35A0F] transition-all duration-300 px-6 py-4"
          >
            See how it works
          </Button>
        </div>
      </div>

      <div className="mt-10 md:mt-0 md:ml-10 flex justify-center md:justify-end w-full md:w-auto animate-in fade-in slide-in-from-right duration-700">
        <Image
          alt="hero-image"
          src={"/hero-img.png"}
          width={600}
          height={200}
          className="w-full max-w-sm md:max-w-none"
          priority
        />
      </div>

      {/* Decorative Wave */}
      <div className="absolute bottom-[-100px] left-0 right-0 w-full">
        <Image
          src="/wave1.svg"
          alt="Decorative wave"
          width={1480}
          height={30}
          className="w-full"
        />
      </div>
    </main>
  );
};

export default TopSection;
