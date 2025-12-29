"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { requireRestaurant } from "@/lib/auth/restaurant";

export interface AnalyticsKPIs {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  completedOrders: number;
}

export interface TopSellingItem {
  name: string;
  quantity: number;
  revenue: number;
}

export interface CategorySales {
  category: string;
  value: number;
}

export interface WeeklySalesData {
  day: string;
  sales: number;
}

/**
 * Get KPIs for analytics dashboard
 */
export async function getAnalyticsKPIs(): Promise<AnalyticsKPIs | null> {
  try {
    const ctx = await requireRestaurant();
    const restaurant_id = ctx.restaurant.id;

    const supabase = await createServerSupabase();

    // Total orders
    const { count: totalOrders } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant_id);

    // Completed orders
    const { count: completedOrders } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant_id)
      .eq("status", "completed");

    // Total revenue (completed orders only)
    const { data: revenueData } = await supabase
      .from("orders")
      .select("total")
      .eq("restaurant_id", restaurant_id)
      .eq("status", "completed");

    const totalRevenue =
      revenueData?.reduce((sum, o) => sum + Number(o.total || 0), 0) || 0;

    const avgOrderValue =
      completedOrders && completedOrders > 0
        ? totalRevenue / completedOrders
        : 0;

    return {
      totalOrders: totalOrders || 0,
      totalRevenue: Math.round(totalRevenue),
      avgOrderValue: Math.round(avgOrderValue),
      completedOrders: completedOrders || 0,
    };
  } catch (error) {
    console.error("Failed to get analytics KPIs:", error);
    return null;
  }
}

/**
 * Get top selling items
 */
export async function getTopSellingItems(
  limit: number = 5
): Promise<TopSellingItem[]> {
  try {
    const ctx = await requireRestaurant();
    const restaurant_id = ctx.restaurant.id;

    const supabase = await createServerSupabase();

    // Fetch all completed orders
    const { data: orders } = await supabase
      .from("orders")
      .select("items")
      .eq("restaurant_id", restaurant_id)
      .eq("status", "completed");

    if (!orders || orders.length === 0) return [];

    // Aggregate items across all orders
    const itemMap = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();

    for (const order of orders) {
      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        const name = item.name || "Unknown";
        const quantity = item.quantity || 0;
        const price = Number(item.price) || 0;
        const revenue = quantity * price;

        if (itemMap.has(name)) {
          const existing = itemMap.get(name)!;
          existing.quantity += quantity;
          existing.revenue += revenue;
        } else {
          itemMap.set(name, { name, quantity, revenue });
        }
      }
    }

    // Convert to array and sort by quantity
    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);

    return topItems;
  } catch (error) {
    console.error("Failed to get top selling items:", error);
    return [];
  }
}

/**
 * Get sales by category
 */
export async function getCategorySales(): Promise<CategorySales[]> {
  try {
    const ctx = await requireRestaurant();
    const restaurant_id = ctx.restaurant.id;

    const supabase = await createServerSupabase();

    // Fetch all menu items with categories
    const { data: menuItems } = await supabase
      .from("menu_items")
      .select("id, name, category")
      .eq("restaurant_id", restaurant_id);

    if (!menuItems || menuItems.length === 0) return [];

    // Create a map of item ID to category
    const itemCategoryMap = new Map<string, string>();
    for (const item of menuItems) {
      itemCategoryMap.set(item.id, item.category || "Other");
    }

    // Fetch completed orders
    const { data: orders } = await supabase
      .from("orders")
      .select("items")
      .eq("restaurant_id", restaurant_id)
      .eq("status", "completed");

    if (!orders || orders.length === 0) return [];

    // Aggregate sales by category
    const categoryMap = new Map<string, number>();

    for (const order of orders) {
      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        const itemId = item.menu_item_id || item.id;
        const category = itemCategoryMap.get(itemId) || "Other";
        const quantity = item.quantity || 0;
        const price = Number(item.price) || 0;
        const revenue = quantity * price;

        categoryMap.set(category, (categoryMap.get(category) || 0) + revenue);
      }
    }

    // Convert to array
    return Array.from(categoryMap.entries()).map(([category, value]) => ({
      category,
      value: Math.round(value),
    }));
  } catch (error) {
    console.error("Failed to get category sales:", error);
    return [];
  }
}

/**
 * Get weekly sales data (last 7 days)
 */
export async function getWeeklySales(): Promise<WeeklySalesData[]> {
  try {
    const ctx = await requireRestaurant();
    const restaurant_id = ctx.restaurant.id;

    const supabase = await createServerSupabase();

    // Get orders from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: orders } = await supabase
      .from("orders")
      .select("created_at, total, status")
      .eq("restaurant_id", restaurant_id)
      .eq("status", "completed")
      .gte("created_at", sevenDaysAgo.toISOString());

    if (!orders || orders.length === 0) {
      // Return empty data for last 7 days
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      return days.map((day) => ({ day, sales: 0 }));
    }

    // Group by day of week
    const dayMap = new Map<string, number>();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (const order of orders) {
      const date = new Date(order.created_at);
      const dayName = dayNames[date.getDay()];
      const total = Number(order.total) || 0;

      dayMap.set(dayName, (dayMap.get(dayName) || 0) + total);
    }

    // Return in order Mon-Sun
    const orderedDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return orderedDays.map((day) => ({
      day,
      sales: Math.round(dayMap.get(day) || 0),
    }));
  } catch (error) {
    console.error("Failed to get weekly sales:", error);
    return [];
  }
}
