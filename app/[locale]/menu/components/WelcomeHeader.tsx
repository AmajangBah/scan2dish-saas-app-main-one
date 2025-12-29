"use client";

import { useParams } from "next/navigation";

export default function WelcomeHeader({
  restaurantName,
}: {
  restaurantName: string;
}) {
  const { tableId } = useParams();

  return (
    <div className="w-full flex flex-col items-center text-center mb-6 mt-6 px-6">
      <div className="bg-white/10 backdrop-blur-md px-4 py-1 rounded-full text-sm mb-6 border border-white/20 text-white">
        🍽️ Table {tableId}
      </div>

      <h1 className="text-3xl font-extrabold text-white leading-tight">
        Welcome to <br /> {restaurantName} 👋
      </h1>

      <p className="text-white/90 mt-4 text-lg">Browse. Order. Enjoy.</p>
    </div>
  );
}
