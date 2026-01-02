"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";

type RestaurantOption = { id: string; name: string };

export function OrdersFilters({
  basePath,
  restaurants,
  initialRestaurantId,
  initialStatus,
}: {
  basePath: string;
  restaurants: RestaurantOption[];
  initialRestaurantId: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const restaurantOptions = useMemo(() => restaurants ?? [], [restaurants]);

  function navigate(next: { restaurant?: string; status?: string }) {
    const params = new URLSearchParams();
    if (next.restaurant) params.set("restaurant", next.restaurant);
    if (next.status) params.set("status", next.status);

    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${basePath}?${qs}` : basePath);
    });
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="min-w-[220px]">
          <label
            htmlFor="admin-orders-restaurant"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Restaurant
          </label>
          <select
            id="admin-orders-restaurant"
            name="restaurant"
            value={initialRestaurantId}
            onChange={(e) =>
              navigate({ restaurant: e.target.value, status: initialStatus })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Restaurants</option>
            {restaurantOptions.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[220px]">
          <label
            htmlFor="admin-orders-status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status
          </label>
          <select
            id="admin-orders-status"
            name="status"
            value={initialStatus}
            onChange={(e) =>
              navigate({ restaurant: initialRestaurantId, status: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
    </div>
  );
}

