"use client";

import { useMemo, useState, useTransition } from "react";

// COMPONENTS
import TableCard from "./components/TableCard";
import TableTabs from "./components/TableTabs";
import AddTableDialog from "./components/AddTableDialog";
import QrDialog from "./components/QrDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Table2 } from "lucide-react";
import Link from "next/link";
import ConfirmDialog from "@/components/ConfirmDialog";

// ACTIONS
import { deleteTable, updateTableStatus } from "@/app/actions/tables";
import { toast } from "sonner";

// TYPES
import type { Table, TableStatus } from "./types";

export default function TablesClient({
  initialTables,
}: {
  initialTables: Table[];
}) {
  const [activeTab, setActiveTab] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const [tables, setTables] = useState<Table[]>(initialTables);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const deleteTarget = useMemo(
    () => (deleteTargetId ? tables.find((t) => t.id === deleteTargetId) : null),
    [deleteTargetId, tables]
  );

  const requestDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    const id = deleteTargetId;
    if (!id) return;
    setDeleteTargetId(null);

    const backup = tables;
    setTables((prev) => prev.filter((x) => x.id !== id));

    startTransition(async () => {
      const res = await deleteTable(id);
      if (!res.success) {
        setTables(backup);
        setError(res.error || "Failed to delete table");
        toast.error("Failed to delete table");
      } else {
        toast.success("Table deleted");
      }
    });
  };

  // Handle status change
  const handleStatusChange = async (id: string, status: TableStatus) => {
    // Only sync available/occupied to database (reserved/cleaning are client-side only)
    if (status !== "available" && status !== "occupied") {
      // Just update locally for UI states
      setTables((prev) =>
        prev.map((table) => (table.id === id ? { ...table, status } : table))
      );
      return;
    }

    const oldTable = tables.find((t) => t.id === id);
    if (!oldTable) return;

    // Optimistic update
    setTables((prev) =>
      prev.map((table) => (table.id === id ? { ...table, status } : table))
    );

    startTransition(async () => {
      const result = await updateTableStatus(id, { status });
      if (!result.success) {
        // Rollback on error
        setTables((prev) =>
          prev.map((table) =>
            table.id === id ? { ...table, status: oldTable.status } : table
          )
        );
        setError(result.error || "Failed to update table status");
      }
    });
  };

  // Open QR dialog
  const handleQrView = (table: Table) => {
    setSelectedTable(table);
    setIsQrDialogOpen(true);
  };

  // Filter tables
  const filteredTables = tables.filter((t) => {
    if (activeTab === "all") return true;
    if (activeTab === "no-qr") return !t.qrAssigned;
    return t.status === activeTab;
  });

  const totalTables = tables.length;
  const activeTables = tables.filter((t) => t.status !== "cleaning").length;
  const missingQr = tables.filter((t) => !t.qrAssigned).length;

  const handleTableAdded = () => {
    // Refresh will happen via revalidatePath in the action
    // Just close the dialog
    setIsAddDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Table Management</h2>
          <p className="text-muted-foreground">
            Manage your restaurant tables and QR codes
          </p>
        </div>

        <AddTableDialog
          open={isAddDialogOpen}
          setOpen={setIsAddDialogOpen}
          onSuccess={handleTableAdded}
        />
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total tables
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tracking-tight">
            {totalTables}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active (today)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tracking-tight">
            {activeTables}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Missing QR
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tracking-tight">
            {missingQr}
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-900 font-semibold"
          >
            ×
          </button>
        </div>
      )}

      {isPending && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
          Updating...
        </div>
      )}

      {/* Tabs */}
      <TableTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Table Grid */}
      {filteredTables.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredTables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onStatusChange={handleStatusChange}
              onQrView={handleQrView}
              onDelete={requestDelete}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-10">
            <div className="mx-auto max-w-md text-center space-y-3">
              <div className="mx-auto h-11 w-11 rounded-xl border bg-muted/30 grid place-items-center">
                {activeTab === "no-qr" ? (
                  <QrCode className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Table2 className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="text-lg font-semibold">
                {activeTab === "no-qr"
                  ? "No tables missing a QR code"
                  : "No tables to show"}
              </div>
              <p className="text-sm text-muted-foreground">
                {totalTables === 0
                  ? "Add your first table to generate a QR code customers can scan."
                  : "Try another filter, or add a new table."}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddDialogOpen(true)}
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-95"
                >
                  Add a table
                </button>
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("all");
                  }}
                  className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted/40"
                >
                  Clear filter
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Dialog */}
      <QrDialog
        open={isQrDialogOpen}
        setOpen={setIsQrDialogOpen}
        table={selectedTable}
      />

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(o) => {
          if (!o) setDeleteTargetId(null);
        }}
        title={deleteTarget ? `Delete Table ${deleteTarget.number}?` : "Delete table?"}
        description="This removes the table and its QR link from your dashboard. Guests won’t be able to scan and order from it."
        confirmLabel="Delete table"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
