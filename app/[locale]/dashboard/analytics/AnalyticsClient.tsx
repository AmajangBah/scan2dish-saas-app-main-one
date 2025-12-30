"use client";

import { formatPrice } from "@/lib/utils/currency";
import type {
  AnalyticsKPIs,
  TopSellingItem,
  CategorySales,
  WeeklySalesData,
} from "@/app/actions/analytics";

interface AnalyticsClientProps {
  kpis: AnalyticsKPIs | null;
  topItems: TopSellingItem[];
  categorySales: CategorySales[];
  weeklySales: WeeklySalesData[];
  currency: string;
}

export default function AnalyticsClient({
  kpis,
  topItems,
  categorySales,
  weeklySales,
  currency,
}: AnalyticsClientProps) {
  // Show empty state if no data
  if (!kpis || kpis.totalOrders === 0) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track your restaurant&apos;s performance
          </p>
        </div>

        <div className="rounded-xl border bg-card p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold mb-2">No Data Yet</h2>
          <p className="text-muted-foreground mb-6">
            Start receiving orders to see your analytics dashboard come to life!
          </p>
          <div className="text-sm text-muted-foreground">
            <p>Analytics will show:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Revenue trends and KPIs</li>
              <li>Top-selling menu items</li>
              <li>Sales by category</li>
              <li>Weekly performance charts</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your restaurant&apos;s performance
        </p>
      </div>

      {/* KPIs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="text-sm text-muted-foreground mb-1">Total Orders</div>
          <div className="text-3xl font-bold">{kpis.totalOrders}</div>
          <div className="text-xs text-muted-foreground mt-2">All time</div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
          <div className="text-3xl font-bold">{formatPrice(kpis.totalRevenue, currency)}</div>
          <div className="text-xs text-emerald-600 mt-2">
            {kpis.completedOrders} completed orders
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="text-sm text-muted-foreground mb-1">Avg Order Value</div>
          <div className="text-3xl font-bold">{formatPrice(kpis.avgOrderValue, currency)}</div>
          <div className="text-xs text-muted-foreground mt-2">Per completed order</div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="text-sm text-muted-foreground mb-1">Completion Rate</div>
          <div className="text-3xl font-bold">
            {kpis.totalOrders > 0
              ? Math.round((kpis.completedOrders / kpis.totalOrders) * 100)
              : 0}
            %
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {kpis.completedOrders} of {kpis.totalOrders} orders
          </div>
        </div>
      </div>

      {/* Weekly Sales Chart */}
      {weeklySales.length > 0 && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Weekly Sales (Last 7 Days)</h2>
          <div className="h-64 flex items-end justify-between gap-2">
            {weeklySales.map((day, i) => {
              const maxSales = Math.max(...weeklySales.map((d) => d.sales), 1);
              const heightPercent = (day.sales / maxSales) * 100;

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-xs font-medium">{formatPrice(day.sales, currency)}</div>
                  <div
                    className="w-full bg-primary rounded-t-lg transition-all hover:opacity-80"
                    style={{ height: `${heightPercent}%`, minHeight: "4px" }}
                  ></div>
                  <div className="text-xs text-muted-foreground font-medium">
                    {day.day}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Sales */}
      {categorySales.length > 0 && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Sales by Category</h2>
          <div className="space-y-4">
            {categorySales.map((cat, i) => {
              const total = categorySales.reduce((sum, c) => sum + c.value, 0);
              const percent = total > 0 ? (cat.value / total) * 100 : 0;

              return (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{cat.category}</span>
                    <span className="text-muted-foreground">
                      {formatPrice(cat.value, currency)} ({Math.round(percent)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Selling Items */}
      {topItems.length > 0 && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Top Selling Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Item</th>
                  <th className="pb-3 font-medium text-right">Qty Sold</th>
                  <th className="pb-3 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topItems.map((item, i) => (
                  <tr key={i} className="text-sm">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {i + 1}
                        </div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-right font-semibold">
                      {formatPrice(Math.round(item.revenue), currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
