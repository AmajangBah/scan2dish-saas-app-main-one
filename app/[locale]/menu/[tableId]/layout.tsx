/**
 * Menu Layout with Enforcement
 * Checks restaurant status and blocks access if menu is disabled
 */

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import TopHeader from "../components/TopHeader";

export default async function MenuLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = await params;
  const supabase = await createClient();

  // Get table and restaurant info
  const { data: table, error: tableError } = await supabase
    .from("restaurant_tables")
    .select(
      `
      id,
      table_number,
      is_active,
      restaurant:restaurants!restaurant_id(
        id,
        name,
        menu_enabled,
        enforcement_reason
      )
    `
    )
    .eq("id", tableId)
    .single();

  // Table not found or inactive
  if (tableError || !table) {
    notFound();
  }

  // Table exists but is inactive
  if (!table.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Table Unavailable
          </h1>
          <p className="text-gray-600">
            This table is currently inactive. Please contact staff for assistance.
          </p>
        </div>
      </div>
    );
  }

  const restaurant = Array.isArray(table.restaurant)
    ? table.restaurant[0]
    : table.restaurant;

  // Critical: Check if restaurant menu is enabled (Commission Enforcement)
  if (!restaurant?.menu_enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Menus Currently Unavailable
          </h1>
          <p className="text-gray-600 mb-4">
            We&apos;re unable to show the menu at this time. Please contact staff to
            place your order.
          </p>
          {restaurant?.enforcement_reason && (
            <div className="text-sm text-gray-500 italic mt-4 p-3 bg-gray-50 rounded">
              {restaurant.enforcement_reason}
            </div>
          )}
          <div className="mt-6 text-sm text-gray-500">
            <p className="font-medium">{restaurant?.name}</p>
            <p>Table {table.table_number}</p>
          </div>
        </div>
      </div>
    );
  }

  // Restaurant is active - allow access
  return (
    <>
      <TopHeader title={restaurant?.name ?? ""} />
      {children}
    </>
  );
}
