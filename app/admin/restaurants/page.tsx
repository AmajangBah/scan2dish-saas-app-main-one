/**
 * Admin: Restaurant Management
 * View and manage all restaurants
 */

import { requireAdmin } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { CheckCircle, XCircle, Eye, Search } from "lucide-react";
import RestaurantControls from "./RestaurantControls";

export default async function AdminRestaurants({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  await requireAdmin();
  const search = await searchParams;
  const supabase = await createServerSupabase();
  const basePath = "/admin/restaurants";

  // Build query
  let query = supabase
    .from("restaurants")
    .select("*")
    .order("created_at", { ascending: false });

  if (search.status === "active") {
    query = query.eq("menu_enabled", true);
  } else if (search.status === "disabled") {
    query = query.eq("menu_enabled", false);
  }

  if (search.search) {
    query = query.ilike("name", `%${search.search}%`);
  }

  const { data: restaurants } = await query;

  // Get counts for each restaurant
  const restaurantsWithStats = await Promise.all(
    (restaurants || []).map(async (restaurant) => {
      const [ordersResult, menuResult, tablesResult] = await Promise.all([
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("restaurant_id", restaurant.id),
        supabase
          .from("menu_items")
          .select("*", { count: "exact", head: true })
          .eq("restaurant_id", restaurant.id),
        supabase
          .from("restaurant_tables")
          .select("*", { count: "exact", head: true })
          .eq("restaurant_id", restaurant.id),
      ]);

      return {
        ...restaurant,
        order_count: ordersResult.count || 0,
        menu_count: menuResult.count || 0,
        table_count: tablesResult.count || 0,
        commission_balance:
          restaurant.total_commission_owed - restaurant.total_commission_paid,
      };
    })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restaurants</h1>
          <p className="text-gray-600 mt-1">
            Manage all restaurants and their status
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <form action={basePath} method="get">
              <input
                type="text"
                name="search"
                placeholder="Search restaurants..."
                defaultValue={search.search}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </form>
          </div>
          <div className="flex gap-2">
            <FilterButton
              href={basePath}
              label="All"
              active={!search.status}
            />
            <FilterButton
              href={`${basePath}?status=active`}
              label="Active"
              active={search.status === "active"}
            />
            <FilterButton
              href={`${basePath}?status=disabled`}
              label="Disabled"
              active={search.status === "disabled"}
            />
          </div>
        </div>
      </div>

      {/* Restaurant List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Restaurant
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Stats
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Commission
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {restaurantsWithStats.map((restaurant) => (
              <tr key={restaurant.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">
                      {restaurant.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {restaurant.phone || "No phone"}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Joined {new Date(restaurant.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {restaurant.menu_enabled ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium text-green-600">
                          Active
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-sm font-medium text-red-600">
                          Disabled
                        </span>
                      </>
                    )}
                  </div>
                  {restaurant.enforcement_reason && (
                    <div className="text-xs text-gray-500 mt-1">
                      {restaurant.enforcement_reason}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600">
                    <div>{restaurant.order_count} orders</div>
                    <div>{restaurant.menu_count} menu items</div>
                    <div>{restaurant.table_count} tables</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <div className="font-semibold text-orange-600">
                      ${restaurant.commission_balance.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Owed: ${restaurant.total_commission_owed.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Paid: ${restaurant.total_commission_paid.toFixed(2)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/restaurants/${restaurant.id}`}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <RestaurantControls restaurant={restaurant} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {restaurantsWithStats.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No restaurants found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterButton({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-orange-100 text-orange-700"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {label}
    </Link>
  );
}
