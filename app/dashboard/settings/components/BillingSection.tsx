"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils/currency";
import { getUsageMetrics, type UsageMetrics } from "@/app/actions/usage";
import { getCommissionPaymentReceipts, type CommissionPaymentReceipt } from "@/app/actions/commissionPayments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer } from "lucide-react";

export default function BillingSection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UsageMetrics | null>(null);
  const [receiptsLoading, setReceiptsLoading] = useState(true);
  const [receiptsError, setReceiptsError] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<{
    currency: string;
    total_commission_owed: number;
    total_commission_paid: number;
    last_payment_date: string | null;
    payments: CommissionPaymentReceipt[];
  } | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<CommissionPaymentReceipt | null>(null);

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

  useEffect(() => {
    async function loadReceipts() {
      setReceiptsLoading(true);
      setReceiptsError(null);
      try {
        const r = await getCommissionPaymentReceipts();
        setReceipts(r);
      } catch (e) {
        setReceiptsError(e instanceof Error ? e.message : "Failed to load receipts");
      } finally {
        setReceiptsLoading(false);
      }
    }
    loadReceipts();
  }, []);

  const currency = receipts?.currency || data?.currency || "GMD";
  const commissionPaid = receipts?.total_commission_paid ?? data?.commissionPaidTotal ?? 0;
  const commissionOwed = receipts?.total_commission_owed ?? data?.commissionOwedTotal ?? 0;
  const commissionDue = Math.max(0, commissionOwed - commissionPaid);

  const printReceipt = (payment: CommissionPaymentReceipt) => {
    const win = window.open("", "", "width=420,height=650");
    if (!win) return;

    const paidAt = payment.payment_date ? new Date(payment.payment_date) : null;
    const receiptNo = payment.receipt_number || `CP-${payment.id.slice(0, 8).toUpperCase()}`;

    const html = `
      <html>
        <head>
          <title>Commission Payment Receipt</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding: 14px; color: #111827; }
            .muted { color: #6b7280; }
            .row { display:flex; justify-content:space-between; gap:12px; }
            .box { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; margin-top: 12px; }
            .title { font-size: 16px; font-weight: 800; letter-spacing: .2px; }
            .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New"; font-size: 12px; }
            .hr { border-top: 1px dashed #e5e7eb; margin: 12px 0; }
            .big { font-size: 18px; font-weight: 800; }
          </style>
        </head>
        <body>
          <div class="title">Commission Payment Receipt</div>
          <div class="muted">Scan2Dish (admin recorded)</div>
          <div class="hr"></div>

          <div class="box">
            <div class="row"><div class="muted">Receipt #</div><div class="mono">${receiptNo}</div></div>
            <div class="row"><div class="muted">Date</div><div>${paidAt ? paidAt.toLocaleString() : "-"}</div></div>
            <div class="row"><div class="muted">Method</div><div>${payment.payment_method.replace("_", " ")}</div></div>
            <div class="row"><div class="muted">Reference</div><div class="mono">${payment.reference_number || "-"}</div></div>
          </div>

          <div class="box">
            <div class="row"><div class="muted">Amount</div><div class="big">${formatPrice(payment.amount, currency)}</div></div>
          </div>

          ${payment.notes ? `<div class="box"><div class="muted">Notes</div><div style="margin-top:6px; white-space:pre-wrap">${payment.notes}</div></div>` : ""}

          <div class="hr"></div>
          <div class="muted" style="font-size:12px;">This receipt confirms a commission payment recorded by Scan2Dish Admin.</div>
        </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

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

      {(data || receipts) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Commission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Paid</span>
                <span className="font-semibold">
                  {formatPrice(commissionPaid, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Owed</span>
                <span className="font-semibold">
                  {formatPrice(commissionOwed, currency)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t">
                <span className="text-slate-500">Due</span>
                <span className="font-semibold">
                  {formatPrice(commissionDue, currency)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Revenue (30d)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {formatPrice(data?.revenue30d ?? 0, currency)}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Last payment</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              {receipts?.last_payment_date
                ? new Date(receipts.last_payment_date).toLocaleString()
                : "No payments recorded yet."}
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Receipts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {receiptsLoading && (
            <div className="text-sm text-slate-500">Loading receipts…</div>
          )}
          {receiptsError && (
            <div className="text-sm text-red-600">{receiptsError}</div>
          )}

          {!receiptsLoading && !receiptsError && (receipts?.payments.length ?? 0) === 0 && (
            <div className="text-sm text-slate-500">
              No commission payment receipts yet. When a super admin records a payment, it will appear here.
            </div>
          )}

          {(receipts?.payments ?? []).length > 0 && (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-xs text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Date</th>
                    <th className="px-4 py-2 text-left font-medium">Receipt</th>
                    <th className="px-4 py-2 text-left font-medium">Method</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                    <th className="px-4 py-2 text-right font-medium">Amount</th>
                    <th className="px-4 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {receipts?.payments.slice(0, 20).map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {p.receipt_number || `CP-${p.id.slice(0, 8).toUpperCase()}`}
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {p.payment_method.replace("_", " ")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">
                          {p.receipt_sent_at ? "Sent" : "Recorded"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatPrice(p.amount, currency)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReceipt(p);
                              setReceiptOpen(true);
                            }}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => printReceipt(p)}
                            className="gap-2"
                          >
                            <Printer className="h-4 w-4" />
                            Print
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={receiptOpen}
        onOpenChange={(o) => {
          setReceiptOpen(o);
          if (!o) setSelectedReceipt(null);
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Payment receipt</DialogTitle>
            <DialogDescription>
              Commission payment recorded by Scan2Dish Admin.
            </DialogDescription>
          </DialogHeader>

          {!selectedReceipt ? (
            <div className="text-sm text-muted-foreground">No receipt selected.</div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="text-xs text-muted-foreground">Receipt #</div>
                <div className="font-mono text-sm">
                  {selectedReceipt.receipt_number || `CP-${selectedReceipt.id.slice(0, 8).toUpperCase()}`}
                </div>
                <Separator className="my-3" />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Date</div>
                    <div>
                      {selectedReceipt.payment_date
                        ? new Date(selectedReceipt.payment_date).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Amount</div>
                    <div className="font-semibold">
                      {formatPrice(selectedReceipt.amount, currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Method</div>
                    <div className="capitalize">
                      {selectedReceipt.payment_method.replace("_", " ")}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Reference</div>
                    <div className="font-mono text-xs">
                      {selectedReceipt.reference_number || "—"}
                    </div>
                  </div>
                </div>
              </div>

              {selectedReceipt.notes && (
                <div className="rounded-xl border p-4">
                  <div className="text-xs text-muted-foreground">Notes</div>
                  <div className="text-sm whitespace-pre-wrap mt-1">{selectedReceipt.notes}</div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => selectedReceipt && printReceipt(selectedReceipt)}
              disabled={!selectedReceipt}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
