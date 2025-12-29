"use client";

import { usePathname } from "next/navigation";
import { Moon } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";

export default function RestaurantNavBar({ restaurantName }: { restaurantName: string }) {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("s2d_theme") : null;
    const isDark = saved === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  // Clean segments
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .filter((seg) => isNaN(Number(seg))); // remove dynamic IDs

  // Get last meaningful part
  const last = segments[segments.length - 1];

  // Convert slug → Title
  const pageTitle =
    !last || last === "dashboard"
      ? "Overview"
      : last.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <nav className="flex items-center justify-between px-6 py-5 border-b sticky top-0 z-50 w-full backdrop-blur-sm bg-white/70">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold truncate">{pageTitle}</h1>
          <p className="text-xs text-gray-500 truncate">{restaurantName}</p>
        </div>
      </div>

      {/* Right icons */}
      <div className="flex items-center gap-6">
        <LanguageSwitcher />
        <button
          type="button"
          onClick={() => {
            const next = !dark;
            setDark(next);
            document.documentElement.classList.toggle("dark", next);
            window.localStorage.setItem("s2d_theme", next ? "dark" : "light");
          }}
          className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
          aria-label="Toggle theme"
        >
          <Moon className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    </nav>
  );
}
