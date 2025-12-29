"use client";

import { useState, useTransition } from "react";

// COMPONENTS
import TableCard from "./components/TableCard";
import TableTabs from "./components/TableTabs";
import AddTableDialog from "./components/AddTableDialog";
import QrDialog from "./components/QrDialog";

// ACTIONS
import { updateTableStatus } from "@/app/actions/tables";

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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredTables.map((table) => (
          <TableCard
            key={table.id}
            table={table}
            onStatusChange={handleStatusChange}
            onQrView={handleQrView}
          />
        ))}
      </div>

      {/* QR Dialog */}
      <QrDialog
        open={isQrDialogOpen}
        setOpen={setIsQrDialogOpen}
        table={selectedTable}
      />
    </div>
  );
}
