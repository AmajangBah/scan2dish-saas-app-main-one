"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils/currency";
import { getUsageMetrics, type UsageMetrics } from "@/app/actions/usage";

export default function UsageSection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UsageMetrics | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const m = await getUsageMetrics();
        setData(m);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load usage");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Usage & Commission</h1>
        <p className="text-sm text-slate-500 mt-1">
          Live metrics for your restaurant (last 30 days).
        </p>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500">Orders (30d)</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{data.orders30d}</CardContent>
            </Card>
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500">Revenue (30d)</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                {formatPrice(data.revenue30d, data.currency)}
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500">Commission owed</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                {formatPrice(data.commissionOwedTotal, data.currency)}
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500">Commission paid</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                {formatPrice(data.commissionPaidTotal, data.currency)}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Recent orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentOrders.length === 0 ? (
                <div className="text-sm text-gray-500">No recent orders.</div>
              ) : (
                data.recentOrders.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between rounded-xl border bg-white p-4"
                  >
                    <div>
                      <div className="font-semibold">
                        Table {o.table_number || "—"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(o.created_at).toLocaleString()} • {o.status}
                      </div>
                    </div>
                    <div className="font-semibold">
                      {formatPrice(o.total, data.currency)}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

