"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, QrCode } from "lucide-react";

import { Table, getStatusColor } from "../types";
import TableStatusMenu from "./TableStatusMenu";

export default function TableCard({
  table,
  onStatusChange,
  onQrView,
}: {
  table: Table;
  onStatusChange: (id: string, status: Table["status"]) => void;
  onQrView: (table: Table) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex justify-between">
          <div>
            <CardTitle>Table {table.number}</CardTitle>
            <p className="text-sm text-muted-foreground">{table.location || "—"}</p>
          </div>

          <Badge className={getStatusColor(table.status)}>{table.status}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <p>Capacity: {table.capacity ?? "—"}</p>

        {table.qrAssigned && (
          <div className="flex items-center text-sm text-muted-foreground">
            <QrCode className="h-3 w-3 mr-1" />
            {table.qrScans} scans
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>

        <TableStatusMenu table={table} onStatusChange={onStatusChange} />

        <Button variant="outline" size="sm" onClick={() => onQrView(table)}>
          <QrCode className="h-4 w-4 mr-2" /> View QR
        </Button>
      </CardFooter>
    </Card>
  );
}
