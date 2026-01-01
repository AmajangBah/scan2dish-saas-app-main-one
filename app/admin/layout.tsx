/**
 * Admin Layout
 * Provides navigation and layout for admin pages
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  LayoutDashboard,
  Store,
  DollarSign,
  ShoppingCart,
  Activity,
  LogOut,
  Shield,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    redirect("/auth/admin/sign-in");
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-72 border-r bg-card text-card-foreground flex flex-col">
        {/* Header */}
        <div className="p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-700 grid place-items-center border">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold leading-tight truncate">
                Admin
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                Scan2Dish control center
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-6 overflow-auto">
          <div className="space-y-1">
            <div className="px-3 text-xs font-medium text-muted-foreground">
              Overview
            </div>
            <NavLink href="/admin" icon={<LayoutDashboard />}>
              Dashboard
            </NavLink>
          </div>

          <div className="space-y-1">
            <div className="px-3 text-xs font-medium text-muted-foreground">
              Management
            </div>
            <NavLink href="/admin/restaurants" icon={<Store />}>
              Restaurants
            </NavLink>
            <NavLink href="/admin/payments" icon={<DollarSign />}>
              Payments
            </NavLink>
          </div>

          <div className="space-y-1">
            <div className="px-3 text-xs font-medium text-muted-foreground">
              Monitoring
            </div>
            <NavLink href="/admin/orders" icon={<ShoppingCart />}>
              Orders
            </NavLink>
            <NavLink href="/admin/activity" icon={<Activity />}>
              Activity Logs
            </NavLink>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="text-sm mb-3">
            <div className="font-medium truncate">{adminUser.full_name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {adminUser.email}
            </div>
            <div className="text-[10px] text-orange-700 uppercase mt-1 tracking-wide">
              {adminUser.role.replace("_", " ")}
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              const supabase = await createClient();
              await supabase.auth.signOut();
              redirect("/auth/admin/sign-in");
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border bg-background hover:bg-muted/50 transition-colors text-sm"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors text-sm"
    >
      <span className="h-5 w-5 text-muted-foreground">{icon}</span>
      {children}
    </Link>
  );
}
