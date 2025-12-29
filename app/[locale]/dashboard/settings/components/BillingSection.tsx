"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils/currency";
import { getUsageMetrics, type UsageMetrics } from "@/app/actions/usage";

export default function BillingSection() {
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
        setError(e instanceof Error ? e.message : "Failed to load billing");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Billing</h1>
        <p className="text-slate-500 text-sm mt-1">
          Live billing summary (commission totals).
        </p>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Commission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Paid</span>
                <span className="font-semibold">
                  {formatPrice(data.commissionPaidTotal, data.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Owed</span>
                <span className="font-semibold">
                  {formatPrice(data.commissionOwedTotal, data.currency)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Revenue (30d)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {formatPrice(data.revenue30d, data.currency)}
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Invoices</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">
          Invoice history isn’t available yet because invoices are not stored in the database.
        </CardContent>
      </Card>
    </div>
  );
}
