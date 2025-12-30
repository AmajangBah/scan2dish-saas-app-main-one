import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/utils/currency";

export default async function OrderTracker({
  params,
}: {
  params: { locale: string; tableId: string; orderId: string };
}) {
  const { locale, tableId, orderId } = params;
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
      restaurant_tables!inner(
        table_number,
        restaurants!restaurant_id(currency)
      )
    `)
    .eq("id", orderId)
    .eq("table_id", tableId)
    .single();

  if (error || !order) {
    notFound();
  }

  // Map status to progress steps
  const status = order.status as "pending" | "preparing" | "completed" | "cancelled";
  
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
  } else if (status === "cancelled") {
    estimatedTime = "Cancelled";
  }

  // Get items summary
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce(
    (sum: number, item: { name?: string; quantity?: number; price?: number }) => {
      // Don't count discount line-items (if ever added later)
      if (String(item.name || "").toLowerCase() === "discount") return sum;
      return sum + (item.quantity || 1);
    },
    0
  );
  const rt = (order as unknown as {
    restaurant_tables:
      | { table_number?: string; restaurants?: { currency?: string } }[]
      | { table_number?: string; restaurants?: { currency?: string } }
      | null
      | undefined;
  }).restaurant_tables;
  const tableNumber = Array.isArray(rt) ? rt[0]?.table_number : rt?.table_number;
  const currency = Array.isArray(rt) ? rt[0]?.restaurants?.currency : rt?.restaurants?.currency;
  const currencyCode = currency ? String(currency) : "GMD";

  return (
    <div className="min-h-dvh pb-10 px-4 pt-6 bg-background">
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold tracking-tight text-center mb-2">
          Order Tracking
        </h2>
        <p className="text-center text-muted-foreground text-sm mb-6">
          Table {tableNumber} • {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>

        <div className="bg-card p-6 rounded-2xl border shadow-sm">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((s, i) => (
              <div key={s.id} className="flex-1 text-center relative">
                {i > 0 && (
                  <div
                    className={`absolute top-4 right-1/2 w-full h-1 -z-10 ${
                      steps[i - 1].done ? "bg-[var(--menu-brand)]" : "bg-muted"
                    }`}
                  />
                )}
                <div
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                    s.done
                      ? "bg-[var(--menu-brand)] text-white"
                      : "bg-muted text-muted-foreground"
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
              <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-xl border border-blue-100">
                <p className="font-semibold">Order received!</p>
                <p className="text-sm">Your order is in the queue.</p>
              </div>
            )}
            {status === "preparing" && (
              <div className="bg-primary/10 text-primary px-4 py-3 rounded-xl border border-primary/15">
                <p className="font-semibold">Being prepared!</p>
                <p className="text-sm">Your food is being cooked.</p>
              </div>
            )}
            {status === "completed" && (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-100">
                <p className="font-semibold">Order ready!</p>
                <p className="text-sm">Your order is ready to be served.</p>
              </div>
            )}
            {status === "cancelled" && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-xl border border-destructive/15">
                <p className="font-semibold">Order cancelled</p>
                <p className="text-sm">Please contact staff if you still need help.</p>
              </div>
            )}
          </div>

          {/* Estimated Time */}
          <div className="text-center mb-6">
            <p className="text-muted-foreground text-sm">Estimated time</p>
            <p className="text-2xl font-semibold mt-1">{estimatedTime}</p>
          </div>

          {/* Order Items */}
          <div className="border-t pt-4 mb-4">
            <p className="text-sm font-semibold mb-2">Your order</p>
            <div className="space-y-1">
              {items.length === 0 && (
                <div className="text-sm text-muted-foreground">No items.</div>
              )}
              {items.map((item: {name?: string; quantity?: number; price?: number}, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-foreground">
                    {formatPrice(
                      parseFloat(String(item.price || 0)) * (item.quantity || 1),
                      currencyCode
                    )}
                  </span>
                </div>
              ))}
            </div>
            {(() => {
              const itemsSubtotal = items.reduce(
                (sum: number, it: { price?: number; quantity?: number; name?: string }) => {
                  const name = String(it.name || "").toLowerCase();
                  if (name === "discount") return sum;
                  return sum + parseFloat(String(it.price || 0)) * (it.quantity || 1);
                },
                0
              );
              const orderTotal = parseFloat(String(order.total || 0));
              const discount = Math.max(0, itemsSubtotal - orderTotal);
              return (
                <div className="mt-2 pt-2 border-t space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(itemsSubtotal, currencyCode)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="text-emerald-700">
                        −{formatPrice(discount, currencyCode)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatPrice(orderTotal, currencyCode)}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          <Link
            href={`/${locale}/menu/${tableId}/browse`}
            className="mt-4 block bg-[var(--menu-brand)] hover:bg-[var(--menu-brand)]/90 text-white text-center py-3 rounded-xl font-medium"
          >
            Back to menu
          </Link>
        </div>
      </div>
    </div>
  );
}
