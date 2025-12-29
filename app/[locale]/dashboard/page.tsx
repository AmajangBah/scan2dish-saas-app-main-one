import Link from "next/link";
import DashboardCard from "../components/DashboardCard";
import Route from "../../constants/Route";
import { ShoppingBag, DollarSign, Utensils, Timer } from "lucide-react";
import ActivityFeed from "../components/ActivityFeed";
import { ActivityItem } from "@/types/activity";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRestaurantPage } from "@/lib/auth/restaurant";

export default async function Dashboard() {
  const ctx = await requireRestaurantPage();
  const restaurant_id = ctx.restaurant.id;

  const supabase = await createServerSupabase();

  // Fetch restaurant name
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name")
    .eq("id", restaurant_id)
    .single();

  const restaurantName = restaurant?.name || "Restaurant";

  // Fetch dashboard stats
  const { count: totalOrders } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurant_id);

  const { data: revenueData } = await supabase
    .from("orders")
    .select("total")
    .eq("restaurant_id", restaurant_id)
    .eq("status", "completed");

  const revenue =
    revenueData?.reduce((sum, o) => sum + Number(o.total || 0), 0) || 0;

  const { count: activeTables } = await supabase
    .from("restaurant_tables")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurant_id)
    .eq("is_active", true);

  const { count: pendingOrders } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurant_id)
    .in("status", ["pending", "preparing"]);

  // Fetch recent activity (last 5 orders)
  const { data: recentOrders } = await supabase
    .from("orders")
    .select(
      `
      id,
      items,
      created_at,
      restaurant_tables!inner(table_number)
    `
    )
    .eq("restaurant_id", restaurant_id)
    .order("created_at", { ascending: false })
    .limit(5);

  const activityData: ActivityItem[] =
    recentOrders?.map((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      const rt = (order as any).restaurant_tables as
        | { table_number?: string }[]
        | { table_number?: string }
        | null
        | undefined;
      const tableNumber = Array.isArray(rt)
        ? rt[0]?.table_number
        : rt?.table_number;
      return {
        id: order.id,
        table: parseInt(tableNumber || "0"),
        time: new Date(order.created_at).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        items: items.map(
          (item: {
            name?: string;
            quantity?: number;
            price?: string | number;
          }) => ({
            name: item.name || "Unknown",
            quantity: item.quantity || 1,
            price: parseFloat(String(item.price || 0)),
          })
        ),
      };
    }) || [];

  return (
    <section className="p-6 w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold my-4">
          Welcome back 👋 {restaurantName}
        </h1>
        <p className="text-gray-600 text-sm">
          Here's the latest overview of your restaurant performance
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <DashboardCard
          heading="Total Orders"
          figure={totalOrders || 0}
          accent="orange"
          icon={<ShoppingBag />}
        />
        <DashboardCard
          heading="Revenue"
          figure={Math.round(revenue)}
          accent="green"
          icon={<DollarSign />}
        />
        <DashboardCard
          heading="Active Tables"
          figure={activeTables || 0}
          accent="blue"
          icon={<Utensils />}
        />
        <DashboardCard
          heading="Pending Orders"
          figure={pendingOrders || 0}
          accent="red"
          icon={<Timer />}
        />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href={Route.TABLES}>
          <DashboardCard heading="Add More Tables" isAddCard />
        </Link>

        <Link href={Route.MENU}>
          <DashboardCard heading="Add More Menu Items" isAddCard />
        </Link>
      </div>

      {activityData.length > 0 && <ActivityFeed activities={activityData} />}
    </section>
  );
}
