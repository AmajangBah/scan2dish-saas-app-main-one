import { createServerSupabase } from "@/lib/supabase/server";
import TablesClient from "./TablesClient";
import { Table, TableStatus } from "./types";
import { requireRestaurantPage } from "@/lib/auth/restaurant";

export default async function TablesPage() {
  const ctx = await requireRestaurantPage();
  const restaurant_id = ctx.restaurant.id;

  const supabase = await createServerSupabase();

  const { data: tables, error } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("restaurant_id", restaurant_id)
    .order("table_number", { ascending: true });

  if (error) {
    console.error("Failed to fetch tables:", error);
    return (
      <div className="p-6 min-h-screen">
        <div className="text-center text-red-600">
          Failed to load tables. Please try again later.
        </div>
      </div>
    );
  }

  // Map database tables to UI Table type
  const mappedTables: Table[] = (tables || []).map((table) => ({
    id: table.id,
    number: table.table_number ?? "",
    capacity: table.capacity ?? 0,
    status: (table.status || "available") as TableStatus,
    location: table.location ?? "",
    qrAssigned: table.qr_assigned ?? false,
    qrScans: table.qr_scans ?? 0,
  }));

  return <TablesClient initialTables={mappedTables} />;
}
