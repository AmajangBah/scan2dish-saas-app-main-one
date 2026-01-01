import Link from "next/link";
import DashboardCard from "./components/DashboardCard";
import Route from "@/app/constants/Route";
import { ShoppingBag, DollarSign, Utensils, Timer } from "lucide-react";
import ActivityFeed from "./components/ActivityFeed";
import { ActivityItem } from "@/types/activity";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRestaurantPage } from "@/lib/auth/restaurant";
import LiveOrdersWidget, { type LiveOrderSummary } from "./LiveOrdersWidget";
import { formatPrice } from "@/lib/utils/currency";

export default async function Dashboard() {
  const ctx = await requireRestaurantPage();
  const restaurant_id = ctx.restaurant.id;
  const currency = ctx.restaurant.currency ?? "GMD";

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

  // Live orders widget (latest pending/preparing)
  const { data: liveRows } = await supabase
    .from("orders")
    .select(
      `
      id,
      status,
      total,
      created_at,
      restaurant_tables!inner(table_number)
    `
    )
    .eq("restaurant_id", restaurant_id)
    .in("status", ["pending", "preparing"])
    .order("created_at", { ascending: false })
    .limit(6);

  type LiveOrderRow = {
    id: string;
    status: "pending" | "preparing" | "completed";
    total: number | string | null;
    created_at: string;
    restaurant_tables:
      | { table_number?: string }
      | { table_number?: string }[]
      | null
      | undefined;
  };

  const initialLiveOrders: LiveOrderSummary[] = (
    (liveRows as unknown as LiveOrderRow[] | null | undefined) ?? []
  ).map((o) => {
    const rt = o.restaurant_tables;
    const tableNumber = Array.isArray(rt)
      ? rt[0]?.table_number
      : rt?.table_number;
    return {
      id: String(o.id),
      table: tableNumber || "Unknown",
      status: o.status as "pending" | "preparing" | "completed",
      total: Number(o.total || 0).toFixed(2),
      createdAt: String(o.created_at),
    };
  });

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

  type RecentOrder = {
    id: string;
    items: unknown;
    created_at: string;
    restaurant_tables:
      | { table_number?: string }
      | { table_number?: string }[]
      | null
      | undefined;
  };

  const activityData: ActivityItem[] =
    (recentOrders as unknown as RecentOrder[] | null | undefined)?.map(
      (order) => {
        const items = Array.isArray(order.items) ? order.items : [];
        const rt = order.restaurant_tables;
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
      }
    ) || [];

  return (
    <section className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Welcome back, {restaurantName}
        </h1>
        <p className="text-sm text-muted-foreground">
          A quick snapshot of what's happening today.
        </p>
      </div>

      {/* Bento layout */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            heading="Total Orders"
            figure={totalOrders || 0}
            accent="orange"
            icon={<ShoppingBag />}
          />
          <DashboardCard
            heading="Revenue"
            figureText={formatPrice(revenue, currency)}
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

        <div className="lg:col-span-4 grid gap-4">
          <LiveOrdersWidget
            restaurantId={restaurant_id}
            currency={currency}
            initialOrders={initialLiveOrders}
          />
          <Link href={Route.TABLES} className="block">
            <DashboardCard heading="Add a table" isAddCard />
          </Link>
          <Link href={Route.MENU} className="block">
            <DashboardCard heading="Add a menu item" isAddCard />
          </Link>
        </div>

        <div className="lg:col-span-12">
          {activityData.length > 0 ? (
            <ActivityFeed activities={activityData} />
          ) : (
            <div className="rounded-xl border bg-card p-6 text-center">
              <div className="text-base font-semibold">No orders yet</div>
              <p className="text-sm text-muted-foreground mt-1">
                Once customers start scanning table QR codes, you’ll see
                activity here.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
