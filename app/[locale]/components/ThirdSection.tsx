import React from "react";
import Image from "next/image";
import FeatureCard from "./FeatureCard";

const ThirdSection = () => {
  return (
    <section className="min-h-screen bg-[#D35A0F] pb-40 pt-20 rounded-tr-md rounded-tl-md relative flex flex-col items-center px-4 md:px-0">
      <div className="flex flex-col w-full items-center text-center">
        <h3 className="text-2xl text-white font-bold mx-auto leading-relaxed">
          How it works — simple as scan, tap, and enjoy.
        </h3>

        <p className="max-w-full md:max-w-2xl w-full md:w-[30%] font-semibold py-6 md:py-10 leading-relaxed mx-auto text-white">
          Scan2Dish takes the stress out of ordering. Here's what your guests
          and your staff experience every time.
        </p>

        <Image
          src="/STEPS.svg"
          alt="decorative-steps"
          width={1200}
          height={50}
          className="absolute top-70 z-[-80px]"
        />

        {/* Decorative Wave */}
        <div className="absolute bottom-[-200px] left-0 right-0 w-full">
          <Image
            src="/wave2.svg"
            alt="Decorative wave"
            width={1480}
            height={30}
            className="w-full"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl mt-10">
          <FeatureCard
            Heading="1. Scan the QR Code"
            Description="Guests point their camera to scan your table's unique QR code. Each table has its own code, so you know where orders come from."
          />
          <FeatureCard
            Heading="2. Browse & Order"
            Description="They explore your menu right on their phone — no downloads, no lines. Add to cart, choose extras, and send the order in seconds."
          />
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl mt-6">
          <FeatureCard
            Heading="3. Receive Instantly"
            Description="The order pops up on your restaurant dashboard in real time. Your kitchen sees exactly what's needed and from which table."
          />
          <FeatureCard
            Heading="4. Pay & Track (if enabled)"
            Description="Guests point their camera to scan your table's unique QR code. Each table has its own code, so you know where orders come from."
          />
        </div>
      </div>
    </section>
  );
};

export default ThirdSection;
