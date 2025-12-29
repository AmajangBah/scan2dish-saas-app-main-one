import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/utils/currency";

export default async function OrderTracker({
  params,
}: {
  params: { tableId: string; orderId: string };
}) {
  const { tableId, orderId } = params;
  const supabase = await createServerSupabase();

  // Fetch the order
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      items,
      total,
      created_at,
      restaurant_tables!inner(table_number)
    `)
    .eq("id", orderId)
    .eq("table_id", tableId)
    .single();

  if (error || !order) {
    notFound();
  }

  // Map status to progress steps
  const status = order.status as "pending" | "preparing" | "completed";
  
  const steps = [
    { 
      id: 1, 
      label: "Order Received", 
      done: ["pending", "preparing", "completed"].includes(status) 
    },
    { 
      id: 2, 
      label: "Being Prepared", 
      done: ["preparing", "completed"].includes(status) 
    },
    { 
      id: 3, 
      label: "Ready", 
      done: status === "completed" 
    },
  ];

  // Calculate estimated time based on order age and status
  // eslint-disable-next-line react-hooks/purity
  const orderAge = Date.now() - new Date(order.created_at).getTime();
  const minutesElapsed = Math.floor(orderAge / 60000);
  
  let estimatedTime = "7–15 minutes";
  if (status === "preparing") {
    const remaining = Math.max(0, 15 - minutesElapsed);
    estimatedTime = remaining > 0 ? `${remaining} minutes` : "Ready soon!";
  } else if (status === "completed") {
    estimatedTime = "Ready now!";
  }

  // Get items summary
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce((sum: number, item: {quantity?: number}) => sum + (item.quantity || 1), 0);
  const rt = (order as unknown as {
    restaurant_tables:
      | { table_number?: string }[]
      | { table_number?: string }
      | null
      | undefined;
  }).restaurant_tables;
  const tableNumber = Array.isArray(rt) ? rt[0]?.table_number : rt?.table_number;

  return (
    <div className="min-h-screen pb-28 px-4 pt-6">
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2">
          Order Tracking
        </h2>
        <p className="text-center text-gray-600 text-sm mb-6">
          Table {tableNumber} • {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>

        <div className="bg-white p-6 rounded-2xl shadow">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((s, i) => (
              <div key={s.id} className="flex-1 text-center relative">
                {i > 0 && (
                  <div
                    className={`absolute top-4 right-1/2 w-full h-1 -z-10 ${
                      steps[i - 1].done ? "bg-orange-600" : "bg-gray-200"
                    }`}
                  />
                )}
                <div
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                    s.done ? "bg-orange-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {s.done && "✓"}
                </div>
                <div className="text-xs mt-2 font-medium">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Status Message */}
          <div className="text-center mb-6">
            {status === "pending" && (
              <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg">
                <p className="font-semibold">Order received!</p>
                <p className="text-sm">Your order is in the queue.</p>
              </div>
            )}
            {status === "preparing" && (
              <div className="bg-orange-50 text-orange-700 px-4 py-3 rounded-lg">
                <p className="font-semibold">Being prepared!</p>
                <p className="text-sm">Your food is being cooked.</p>
              </div>
            )}
            {status === "completed" && (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg">
                <p className="font-semibold">Order ready!</p>
                <p className="text-sm">Your order is ready to be served.</p>
              </div>
            )}
          </div>

          {/* Estimated Time */}
          <div className="text-center mb-6">
            <p className="text-gray-600 text-sm">Estimated time</p>
            <p className="text-2xl font-bold mt-1">{estimatedTime}</p>
          </div>

          {/* Order Items */}
          <div className="border-t pt-4 mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Your Order:</p>
            <div className="space-y-1">
              {items.map((item: {name?: string; quantity?: number; price?: number}, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-gray-800">
                    {formatPrice((parseFloat(String(item.price || 0)) * (item.quantity || 1)), "GMD")}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t">
              <span>Total</span>
              <span>{formatPrice(parseFloat(order.total), "GMD")}</span>
            </div>
          </div>

          <Link
            href={`/menu/${tableId}/browse`}
            className="mt-4 block bg-orange-600 hover:bg-orange-700 text-white text-center py-3 rounded-xl font-medium"
          >
            Back to menu
          </Link>
        </div>
      </div>
    </div>
  );
}
