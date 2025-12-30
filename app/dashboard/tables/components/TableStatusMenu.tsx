"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Table } from "../types";

export default function TableStatusMenu({
  table,
  onStatusChange,
}: {
  table: Table;
  onStatusChange: (tableId: string, status: Table["status"]) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 border rounded-md">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => onStatusChange(table.id, "available")}>
          <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" /> Available
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onStatusChange(table.id, "occupied")}>
          <XCircle className="h-4 w-4 mr-2 text-red-600" /> Occupied
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onStatusChange(table.id, "reserved")}>
          <Clock className="h-4 w-4 mr-2 text-blue-600" /> Reserved
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onStatusChange(table.id, "cleaning")}>
          <Sparkles className="h-4 w-4 mr-2 text-yellow-600" /> Cleaning
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="text-destructive">
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
