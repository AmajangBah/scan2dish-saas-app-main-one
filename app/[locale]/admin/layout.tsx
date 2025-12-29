/**
 * Admin Layout
 * Provides navigation and layout for admin pages
 */

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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-orange-500" />
            <div>
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <p className="text-xs text-gray-400">Scan2Dish</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <NavLink href="/admin" icon={<LayoutDashboard />}>
            Dashboard
          </NavLink>
          <NavLink href="/admin/restaurants" icon={<Store />}>
            Restaurants
          </NavLink>
          <NavLink href="/admin/payments" icon={<DollarSign />}>
            Payments
          </NavLink>
          <NavLink href="/admin/orders" icon={<ShoppingCart />}>
            Orders
          </NavLink>
          <NavLink href="/admin/activity" icon={<Activity />}>
            Activity Logs
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="text-sm mb-3">
            <div className="font-medium">{adminUser.full_name}</div>
            <div className="text-xs text-gray-400">{adminUser.email}</div>
            <div className="text-xs text-orange-500 uppercase mt-1">
              {adminUser.role.replace("_", " ")}
            </div>
          </div>
          <form action={async () => {
            "use server";
            const supabase = await createClient();
            await supabase.auth.signOut();
            redirect("/auth/admin/sign-in");
          }}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
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
      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-sm"
    >
      <span className="h-5 w-5">{icon}</span>
      {children}
    </Link>
  );
}
