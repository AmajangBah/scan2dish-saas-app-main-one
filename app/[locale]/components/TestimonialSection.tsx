"use client";
import React from "react";
import TestimonialSectionCard from "./TestimonialSectionCard";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const TestimonialSection = () => {
  const testimonials = [
    {
      comment:
        "Scan2Dish literally cut our order times in half. Our customers love scanning and ordering instantly.",
      businessOwnerName: "Fatou’s Bistro",
      businessOwnerImageUrl: "/Logo.png",
      businessOwnerRole: "Banjul",
    },
    {
      comment:
        "Setup took less than 10 minutes. Our customers prefer scanning now.",
      businessOwnerName: "Cafe Tiga",
      businessOwnerImageUrl: "/Logo.png",
      businessOwnerRole: "Serekunda",
    },
    {
      comment: "Orders are faster and more accurate. This system is solid.",
      businessOwnerName: "Musa's Grill",
      businessOwnerImageUrl: "/Logo.png",
      businessOwnerRole: "Brikama",
    },
  ];

  const [cards, setCards] = React.useState(testimonials);

  const nextCard = () => {
    setCards(([a, b, c]) => [b, c, a]); // rotate
  };
  const backCard = () => {
    setCards(([a, b, c]) => [c, a, b]); // rotate
  };

  return (
    <section className="relative min-h-screen bg-[#D35A0F] py-20 flex flex-col items-center mt-20 px-4 md:px-0">
      {/* Heading + Description */}
      <div className="flex flex-col items-center text-center">
        <h2 className="mb-4 text-3xl font-bold text-white">
          Join 300+ restaurants already serving smarter.
        </h2>

        <p className="w-full max-w-2xl leading-relaxed text-white">
          From family diners to trendy cafés — Scan2Dish is making restaurant
          life easier every single day.
        </p>
      </div>

      {/* Stacked Cards */}
      <div className="relative w-full mt-10 flex justify-center items-center h-[380px] ">
        {/* Back */}
        <div className="absolute top-0 scale-90 opacity-60 z-10 hidden sm:block">
          <TestimonialSectionCard {...cards[2]} />
        </div>

        {/* Middle */}
        <div className="absolute top-6 scale-95 opacity-80 z-20 hidden sm:block">
          <TestimonialSectionCard {...cards[1]} />
        </div>

        {/* Front */}
        <div className="absolute top-12 scale-100 z-30 w-full max-w-sm sm:block">
          <TestimonialSectionCard {...cards[0]} />
        </div>
      </div>

      {/* NEXT BUTTON */}
      <div className="flex flex-row gap-2">
        <Button
          onClick={nextCard}
          className="mt-8 p-3 rounded-full bg-white/20 backdrop-blur-md border border-white text-white"
        >
          ⟹
        </Button>
        <Button
          onClick={backCard}
          className="mt-8 p-3 rounded-full bg-white/20 backdrop-blur-md border border-white text-white"
        >
          ⟸
        </Button>
      </div>

      <div className="mt-10">
        <Button className="text-white border border-white py-2 px-2 bg-transparent cursor-pointer hover:bg-white hover:text-[#D35A0F]">
          Get Started — it's free to set up 🍽️
        </Button>
      </div>

      {/* Decorative Wave */}
      <div className="absolute -bottom-20 left-0 right-0 w-full">
        <Image
          src="/wave1.svg"
          alt="Decorative wave"
          width={1480}
          height={30}
          className="w-full"
        />
      </div>
    </section>
  );
};

export default TestimonialSection;
