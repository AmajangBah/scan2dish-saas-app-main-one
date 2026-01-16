import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/utils/currency";
import OrderSuccessSplash from "../../../components/OrderSuccessSplash";
import EstimatedTime from "./EstimatedTime";
import type { Locale } from "@/i18n";

const translations: Record<Locale, Record<string, string>> = {
  en: {
    orderTracking: "Order Tracking",
    item: "item",
    items: "items",
    orderReceived: "Order Received",
    beingPrepared: "Being Prepared",
    ready: "Ready",
    orderReceived_msg: "Order received!",
    inTheQueue: "Your order is in the queue.",
    beingPrepared_msg: "Being prepared!",
    foodBeingCooked: "Your food is being cooked.",
    orderReady: "Order ready!",
    readyToServe: "Your order is ready to be served.",
    orderCancelled: "Order cancelled",
    contactStaff: "Please contact staff.",
    estimatedTime: "Estimated time",
    yourOrder: "Your order",
    noItems: "No items.",
    subtotal: "Subtotal",
    discount: "Discount",
    total: "Total",
    backToMenu: "Back to menu",
  },
  fr: {
    orderTracking: "Suivi de commande",
    item: "article",
    items: "articles",
    orderReceived: "Commande reçue",
    beingPrepared: "En préparation",
    ready: "Prêt",
    orderReceived_msg: "Commande reçue!",
    inTheQueue: "Votre commande est en attente.",
    beingPrepared_msg: "En préparation!",
    foodBeingCooked: "Votre nourriture est en cours de préparation.",
    orderReady: "Commande prête!",
    readyToServe: "Votre commande est prête à être servie.",
    orderCancelled: "Commande annulée",
    contactStaff: "Veuillez contacter le personnel.",
    estimatedTime: "Temps estimé",
    yourOrder: "Votre commande",
    noItems: "Aucun article.",
    subtotal: "Sous-total",
    discount: "Réduction",
    total: "Total",
    backToMenu: "Retour au menu",
  },
  es: {
    orderTracking: "Rastreo de pedido",
    item: "artículo",
    items: "artículos",
    orderReceived: "Pedido recibido",
    beingPrepared: "En preparación",
    ready: "Listo",
    orderReceived_msg: "¡Pedido recibido!",
    inTheQueue: "Su pedido está en espera.",
    beingPrepared_msg: "¡En preparación!",
    foodBeingCooked: "Su comida se está preparando.",
    orderReady: "¡Pedido listo!",
    readyToServe: "Su pedido está listo para servir.",
    orderCancelled: "Pedido cancelado",
    contactStaff: "Póngase en contacto con el personal.",
    estimatedTime: "Tiempo estimado",
    yourOrder: "Su pedido",
    noItems: "Sin artículos.",
    subtotal: "Subtotal",
    discount: "Descuento",
    total: "Total",
    backToMenu: "Volver al menú",
  },
};

/**
 * Next.js 15 / 16:
 * params and searchParams are Promises
 */
type PageProps = {
  params: Promise<{
    locale: string;
    tableId: string;
    orderId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrderTracker({
  params,
  searchParams,
}: PageProps) {
  // ✅ Await params & searchParams
  const { locale, tableId, orderId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};

  const supabase = await createServerSupabase();

  const success =
    resolvedSearchParams.success === "1" ||
    resolvedSearchParams.success === "true" ||
    (Array.isArray(resolvedSearchParams.success) &&
      resolvedSearchParams.success[0] === "1");

  // Fetch order
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      status,
      items,
      total,
      created_at,
      restaurant_tables!inner(
        table_number,
        id,
        restaurants!restaurant_id(currency)
      )
    `
    )
    .eq("id", orderId)
    .single();

  if (error || !order) {
    notFound();
  }

  const status = order.status as
    | "pending"
    | "preparing"
    | "completed"
    | "cancelled";

  const localeStr = locale as Locale;

  const steps = [
    {
      id: 1,
      label: translations[localeStr]["orderReceived"] || "Order Received",
      done: ["pending", "preparing", "completed"].includes(status),
    },
    {
      id: 2,
      label: translations[localeStr]["beingPrepared"] || "Being Prepared",
      done: ["preparing", "completed"].includes(status),
    },
    {
      id: 3,
      label: translations[localeStr]["ready"] || "Ready",
      done: status === "completed",
    },
  ];

  const items = Array.isArray(order.items) ? order.items : [];

  const itemCount = items.reduce(
    (sum: number, item: { name?: string; quantity?: number }) => {
      if (String(item.name || "").toLowerCase() === "discount") return sum;
      return sum + (item.quantity || 1);
    },
    0
  );

  const rt = (
    order as unknown as {
      restaurant_tables:
        | { table_number?: string; restaurants?: { currency?: string } }[]
        | { table_number?: string; restaurants?: { currency?: string } }
        | null;
    }
  ).restaurant_tables;

  const tableNumber = Array.isArray(rt)
    ? rt[0]?.table_number
    : rt?.table_number;

  const currency = Array.isArray(rt)
    ? rt[0]?.restaurants?.currency
    : rt?.restaurants?.currency;

  const currencyCode = currency ? String(currency) : "GMD";
  // REMOVED: Strict table number validation that was causing 404 errors
  // Orders should be accessible via their ID regardless of URL table parameter
  // The order data includes the correct table association

  const trackHref = `/${locale}/menu/${String(tableId)}/order/${orderId}`;

  return (
    <div className="min-h-dvh bg-background px-4 pt-6 pb-10">
      {success && (
        <OrderSuccessSplash trackHref={trackHref} locale={localeStr} />
      )}

      <div className="mx-auto max-w-xl">
        <h2 className="mb-2 text-center text-2xl font-semibold tracking-tight">
          {translations[localeStr]["orderTracking"] || "Order Tracking"}
        </h2>

        <p className="mb-6 text-center text-sm text-muted-foreground">
          Table {tableNumber} • {itemCount}{" "}
          {itemCount === 1
            ? translations[localeStr]["item"] || "item"
            : translations[localeStr]["items"] || "items"}
        </p>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          {/* Progress */}
          <div className="mb-8 flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.id} className="relative flex-1 text-center">
                {i > 0 && (
                  <div
                    className={`absolute right-1/2 top-4 -z-10 h-1 w-full ${
                      steps[i - 1].done ? "bg-[var(--menu-brand)]" : "bg-muted"
                    }`}
                  />
                )}
                <div
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full ${
                    s.done
                      ? "bg-[var(--menu-brand)] text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.done && "✓"}
                </div>
                <div className="mt-2 text-xs font-medium">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Status */}
          <div className="mb-6 text-center">
            {status === "pending" && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-blue-700">
                <p className="font-semibold">
                  {translations[localeStr]["orderReceived_msg"] ||
                    "Order received!"}
                </p>
                <p className="text-sm">
                  {translations[localeStr]["inTheQueue"] ||
                    "Your order is in the queue."}
                </p>
              </div>
            )}
            {status === "preparing" && (
              <div className="rounded-xl border border-primary/15 bg-primary/10 px-4 py-3 text-primary">
                <p className="font-semibold">
                  {translations[localeStr]["beingPrepared_msg"] ||
                    "Being prepared!"}
                </p>
                <p className="text-sm">
                  {translations[localeStr]["foodBeingCooked"] ||
                    "Your food is being cooked."}
                </p>
              </div>
            )}
            {status === "completed" && (
              <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-green-700">
                <p className="font-semibold">
                  {translations[localeStr]["orderReady"] || "Order ready!"}
                </p>
                <p className="text-sm">
                  {translations[localeStr]["readyToServe"] ||
                    "Your order is ready to be served."}
                </p>
              </div>
            )}
            {status === "cancelled" && (
              <div className="rounded-xl border border-destructive/15 bg-destructive/10 px-4 py-3 text-destructive">
                <p className="font-semibold">
                  {translations[localeStr]["orderCancelled"] ||
                    "Order cancelled"}
                </p>
                <p className="text-sm">
                  {translations[localeStr]["contactStaff"] ||
                    "Please contact staff."}
                </p>
              </div>
            )}
          </div>

          {/* ETA */}
          <div className="mb-6 text-center">
            <p className="text-sm text-muted-foreground">
              {translations[localeStr]["estimatedTime"] || "Estimated time"}
            </p>
            <p className="mt-1 text-2xl font-semibold">
              <EstimatedTime
                status={status}
                createdAt={String(order.created_at)}
              />
            </p>
          </div>

          {/* Items */}
          <div className="mb-4 border-t pt-4">
            <p className="mb-2 text-sm font-semibold">
              {translations[localeStr]["yourOrder"] || "Your order"}
            </p>

            <div className="space-y-1">
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {translations[localeStr]["noItems"] || "No items."}
                </p>
              )}

              {items.map(
                (
                  item: { name?: string; quantity?: number; price?: number },
                  index: number
                ) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.quantity}x {item.name}
                    </span>
                    <span>
                      {formatPrice(
                        (item.price || 0) * (item.quantity || 1),
                        currencyCode
                      )}
                    </span>
                  </div>
                )
              )}
            </div>

            {(() => {
              const itemsSubtotal = items.reduce(
                (
                  sum: number,
                  it: { price?: number; quantity?: number; name?: string }
                ) => {
                  if (String(it.name || "").toLowerCase() === "discount")
                    return sum;
                  return sum + (it.price || 0) * (it.quantity || 1);
                },
                0
              );

              const orderTotal = Number(order.total || 0);
              const discount = Math.max(0, itemsSubtotal - orderTotal);

              return (
                <div className="mt-2 space-y-1 border-t pt-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {translations[localeStr]["subtotal"] || "Subtotal"}
                    </span>
                    <span>{formatPrice(itemsSubtotal, currencyCode)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>
                        {translations[localeStr]["discount"] || "Discount"}
                      </span>
                      <span>−{formatPrice(discount, currencyCode)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold">
                    <span>{translations[localeStr]["total"] || "Total"}</span>
                    <span>{formatPrice(orderTotal, currencyCode)}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          <Link
            href={`/${locale}/menu/${String(tableId)}/browse`}
            className="mt-4 block bg-[var(--menu-brand)] hover:bg-[var(--menu-brand)]/90 text-white text-center py-3 rounded-xl font-medium"
          >
            {translations[localeStr]["backToMenu"] || "Back to menu"}
          </Link>
        </div>
      </div>
    </div>
  );
}
