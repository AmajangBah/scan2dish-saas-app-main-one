import {
  getAnalyticsKPIs,
  getTopSellingItems,
  getCategorySales,
  getWeeklySales,
} from "@/app/actions/analytics";
import { requireRestaurantPage } from "@/lib/auth/restaurant";
import AnalyticsClient from "./AnalyticsClient";

export default async function AnalyticsPage() {
  const ctx = await requireRestaurantPage();
  const currency = ctx.restaurant.currency || "GMD";

  // Fetch all analytics data in parallel
  const [kpis, topItems, categorySales, weeklySales] = await Promise.all([
    getAnalyticsKPIs(),
    getTopSellingItems(5),
    getCategorySales(),
    getWeeklySales(),
  ]);

  return (
    <AnalyticsClient
      kpis={kpis}
      topItems={topItems}
      categorySales={categorySales}
      weeklySales={weeklySales}
      currency={currency}
    />
  );
}
