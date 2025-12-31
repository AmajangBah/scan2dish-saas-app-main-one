"use client";

import { CartProvider } from "./context/CartContext";
import { useParams } from "next/navigation";

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const tableId = typeof params.tableId === "string" ? params.tableId : null;

  // This layout wraps all menu pages and injects CartProvider
  return (
    <CartProvider key={tableId ?? "no-table"}>
      <div className="min-h-screen bg-white">
        <main>{children}</main>
      </div>
    </CartProvider>
  );
}
