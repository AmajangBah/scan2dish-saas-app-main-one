"use client";

import { usePathname } from "next/navigation";
import { Moon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function RestaurantNavBar({
  restaurantName,
}: {
  restaurantName: string;
}) {
  const pathname = usePathname();
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("s2d_theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

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
    <nav className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 z-50 w-full backdrop-blur-sm bg-background/70">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold truncate">{pageTitle}</h1>
          <p className="text-xs text-muted-foreground truncate">
            {restaurantName}
          </p>
        </div>
      </div>

      {/* Right icons */}
      <div className="flex items-center gap-6">
        <Button
          type="button"
          onClick={() => {
            const next = !dark;
            setDark(next);
            window.localStorage.setItem("s2d_theme", next ? "dark" : "light");
          }}
          className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted/60"
          aria-label="Toggle theme"
        >
          <Moon className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>
    </nav>
  );
}
