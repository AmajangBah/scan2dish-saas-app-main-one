import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import RestaurantSidebar from "../components/RestaurantSidebar";
import RestaurantNavBar from "../components/RestaurantNavBar";
import React, { ReactNode } from "react";
import { generateMetadataFromPath } from "@/utils/generateMetadata";
import { requireRestaurantPage } from "@/lib/auth/restaurant";

// You can use a function to generate metadata dynamically
export async function generateMetadata() {
  return generateMetadataFromPath("dashboard");
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const ctx = await requireRestaurantPage();

  return (
    <SidebarProvider>
      <RestaurantSidebar restaurantName={ctx.restaurant.name} />
      <SidebarInset className="min-w-0 bg-[#F5F5F5]">
        <RestaurantNavBar restaurantName={ctx.restaurant.name} />
        <main className="p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
