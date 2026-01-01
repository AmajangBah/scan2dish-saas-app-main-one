import { formatPrice } from "@/lib/utils/currency";
import type { Order } from "../types";

export function buildOrderReceiptHtml({
  restaurantName,
  order,
  currency,
}: {
  restaurantName: string;
  order: Order;
  currency: string;
}) {
  const createdAt = order.createdAt ? new Date(order.createdAt) : null;
  const itemsSubtotal = order.items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const total = Number(order.total || 0);
  const discount = Math.max(0, itemsSubtotal - total);

  const rows = order.items
    .map((it) => {
      const line = it.qty * it.price;
      return `
        <tr>
          <td class="item">
            <div class="name">${escapeHtml(it.name)}</div>
            <div class="muted">${it.qty} × ${formatPrice(it.price, currency)}</div>
          </td>
          <td class="right mono">${formatPrice(line, currency)}</td>
        </tr>
      `;
    })
    .join("");

  const receiptNo = `ORD-${order.id.slice(0, 8).toUpperCase()}`;

  return `
  <html>
    <head>
      <title>Order Receipt</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        /* Thermal-ish receipt */
        body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; padding: 12px; color: #111827; }
        .center { text-align: center; }
        .muted { color: #6b7280; }
        .big { font-size: 18px; font-weight: 800; letter-spacing: .2px; }
        .mono { font-family: inherit; }
        .hr { border-top: 1px dashed #e5e7eb; margin: 10px 0; }
        .row { display:flex; justify-content:space-between; gap:10px; }
        .right { text-align:right; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 6px 0; vertical-align: top; }
        td.item { padding-right: 8px; }
        .name { font-weight: 700; }
        .totals .row { margin-top: 6px; }
        .total { font-size: 16px; font-weight: 900; }
      </style>
    </head>
    <body>
      <div class="center">
        <div class="big">${escapeHtml(restaurantName || "Restaurant")}</div>
        <div class="muted">Scan2Dish order receipt</div>
      </div>
      <div class="hr"></div>

      <div class="row"><div class="muted">Table</div><div class="mono">#${escapeHtml(order.table)}</div></div>
      <div class="row"><div class="muted">Receipt</div><div class="mono">${receiptNo}</div></div>
      <div class="row"><div class="muted">Time</div><div class="mono">${createdAt ? createdAt.toLocaleString() : "-"}</div></div>
      ${order.customerName ? `<div class="row"><div class="muted">Customer</div><div class="mono">${escapeHtml(order.customerName)}</div></div>` : ""}
      ${order.notes ? `<div class="row"><div class="muted">Notes</div><div class="mono">${escapeHtml(order.notes)}</div></div>` : ""}

      <div class="hr"></div>

      <table>
        ${rows}
      </table>

      <div class="hr"></div>

      <div class="totals">
        <div class="row"><div class="muted">Subtotal</div><div class="mono">${formatPrice(itemsSubtotal, currency)}</div></div>
        ${discount > 0 ? `<div class="row"><div class="muted">Discount</div><div class="mono">-${formatPrice(discount, currency)}</div></div>` : ""}
        <div class="row total"><div>Total</div><div>${formatPrice(total, currency)}</div></div>
      </div>

      <div class="hr"></div>
      <div class="center muted">Thank you.</div>
    </body>
  </html>
  `;
}

function escapeHtml(s: string) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

