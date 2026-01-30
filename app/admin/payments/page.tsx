/**
 * Admin: Commission Payments
 * View and record commission payments
 */

import { requireAdmin } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { DollarSign } from "lucide-react";
import RecordPaymentButton from "./RecordPaymentButton";

export default async function AdminPayments({
  searchParams,
}: {
  searchParams: Promise<{ restaurant?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const supabase = await createServerSupabase();

  // Get payments
  let query = supabase
    .from("commission_payments")
    .select(
      `
      *,
      restaurant:restaurants!restaurant_id(id, name, currency),
      admin:admin_users!recorded_by(id, full_name, email)
    `
    )
    .order("payment_date", { ascending: false })
    .limit(100);

  if (params.restaurant) {
    query = query.eq("restaurant_id", params.restaurant);
  }

  const { data: payments } = await query;

  // Get restaurants for dropdown
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, name, total_commission_owed, total_commission_paid")
    .order("name");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Commission Payments
          </h1>
          <p className="text-gray-600 mt-1">
            Record and track commission payments
          </p>
        </div>
        <RecordPaymentButton restaurants={restaurants || []} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Recorded</p>
              <p className="text-2xl font-bold text-gray-900">
                ${payments?.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Payment Count</p>
              <p className="text-2xl font-bold text-gray-900">
                {payments?.length || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-gray-900">
                ${restaurants
                  ?.reduce(
                    (sum, r) =>
                      sum +
                      (r.total_commission_owed - r.total_commission_paid),
                    0
                  )
                  .toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Restaurant
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Method
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Reference
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Recorded By
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments?.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">
                  {new Date(payment.payment_date).toLocaleDateString()}
                  <div className="text-xs text-gray-500">
                    {new Date(payment.payment_date).toLocaleTimeString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="font-medium text-gray-900">
                    {payment.restaurant?.name}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="font-semibold text-green-600">
                    ${payment.amount.toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs capitalize">
                    {payment.payment_method.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {payment.reference_number || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {payment.admin?.full_name || "Unknown"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!payments || payments.length === 0) && (
          <div className="text-center py-12 text-gray-500">
            <p>No payments recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
