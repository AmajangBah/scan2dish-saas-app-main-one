"use client";

import Image from "next/image";
import React, { useState } from "react";

const ProductDisplay = () => {
  const showcaseImages = [
    "/product-display-1.png",
    "/product-display-2.png",
    "/product-display-3.png",
  ];

  const [currentImages, setCurrentImages] = useState(showcaseImages);

  const nextProduct = () => {
    // Rotates array: [a, b, c] → [b, c, a]
    setCurrentImages((prev) => [...prev.slice(1), prev[0]]);
  };

  return (
    <section className="min-h-screen bg-[#D35A0F] pb-40 pt-20 my-20 rounded-tr-md rounded-tl-md relative flex flex-col">
      <div className="flex flex-col w-full items-center text-center">
        <h3 className="text-2xl text-white font-bold mx-auto leading-relaxed">
          See What Running a Smart Restaurant Looks Like
        </h3>

        {/* Main Display Image */}
        <div className="mt-10">
          <Image
            src={currentImages[0]}
            alt="Product showcase"
            width={600}
            height={400}
            className="rounded-xl shadow-xl"
          />
        </div>

        {/* Button to rotate */}
        <button
          className="mt-6 px-6 py-3 bg-white/20 text-white rounded-lg"
          onClick={nextProduct}
        >
          Next
        </button>

        {/* Wave decoration */}
        <div className="absolute bottom-[-200px] left-0 right-0 w-full">
          <Image
            src="/wave2.svg"
            alt="Decorative wave"
            width={1480}
            height={30}
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
};

export default ProductDisplay;
