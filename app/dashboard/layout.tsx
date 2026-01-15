import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import RestaurantSidebar from "./components/RestaurantSidebar";
import RestaurantNavBar from "./components/RestaurantNavBar";
import React, { ReactNode } from "react";
import type { Metadata } from "next";
import { getRestaurantAuthContext } from "@/lib/auth/restaurant";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const ctx = await getRestaurantAuthContext();

  if (!ctx) {
    redirect("/login");
  }

  // Enforce onboarding completion
  if (!ctx.onboardingCompleted) {
    redirect("/onboarding");
  }

  return (
    <div
      style={
        {
          "--primary": ctx.restaurant.brand_color ?? "#C84501",
          "--sidebar-primary": ctx.restaurant.brand_color ?? "#C84501",
        } as React.CSSProperties
      }
    >
      <SidebarProvider>
        <RestaurantSidebar
          restaurantId={ctx.restaurant.id}
          restaurantName={ctx.restaurant.name}
        />
        <SidebarInset className="min-w-0 bg-muted/30">
          <RestaurantNavBar restaurantName={ctx.restaurant.name} />
          <main className="p-4 md:p-6">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
