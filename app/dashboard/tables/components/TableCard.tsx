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
import { MapPin, QrCode, Users } from "lucide-react";

import { Table, getStatusColor } from "../types";
import TableStatusMenu from "./TableStatusMenu";

export default function TableCard({
  table,
  onStatusChange,
  onQrView,
  onDelete,
}: {
  table: Table;
  onStatusChange: (id: string, status: Table["status"]) => void;
  onQrView: (table: Table) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl shadow-sm">
      <CardHeader>
        <div className="flex justify-between">
          <div>
            <CardTitle className="text-lg">Table {table.number}</CardTitle>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {table.location || "—"}
            </div>
          </div>

          <Badge className={getStatusColor(table.status)}>{table.status}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Capacity</span>
          <span className="font-medium">{table.capacity ?? "—"}</span>
        </div>

        {table.qrAssigned && (
          <div className="flex items-center text-sm text-muted-foreground">
            <QrCode className="h-3 w-3 mr-1" />
            {table.qrScans} scans
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <TableStatusMenu table={table} onStatusChange={onStatusChange} onDelete={onDelete} />

        <Button variant="outline" size="sm" onClick={() => onQrView(table)}>
          <QrCode className="h-4 w-4 mr-2" /> View QR
        </Button>
      </CardFooter>
    </Card>
  );
}
