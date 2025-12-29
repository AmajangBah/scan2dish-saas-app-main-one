"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ShoppingCart, Globe } from "lucide-react";
import { useCart } from "../context/CartContext";
import { Button } from "@/components/ui/button";

export default function TopHeader({
  title,
}: {
  title: string;
}) {
  const { tableId } = useParams();
  const { items } = useCart();

  return (
    <header className="flex items-center justify-between px-4 py-4 bg-white shadow-sm sticky top-0 z-40">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <Button className="p-2 rounded-md">
          <Globe className="w-5 h-5 text-gray-600" />
        </Button>

        <Link href={`/menu/${tableId}/cart`} className="relative">
          <ShoppingCart className="w-6 h-6 text-gray-700" />
          {items.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full">
              {items.reduce((s, i) => s + i.qty, 0)}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
