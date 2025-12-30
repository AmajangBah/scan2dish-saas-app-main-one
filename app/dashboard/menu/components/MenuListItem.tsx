"use client";

import { MenuItem } from "../types";
import { Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MenuListItemProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onToggleAvailability: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function MenuListItem({
  item,
  onEdit,
  onToggleAvailability,
  onDelete,
}: MenuListItemProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm">
      <div>
        <h3 className="font-semibold">{item.name}</h3>
        <p className="text-gray-500 text-sm">{item.category}</p>
        <p className="text-sm">
          {item.available ? "Available ✅" : "Not Available ❌"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <p className="text-lg font-bold">${item.price.toFixed(2)}</p>

        <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
          <Pencil size={16} className="mr-1" /> Edit
        </Button>

        <Button
          size="sm"
          variant={item.available ? "outline" : "default"}
          onClick={() => onToggleAvailability(item.id)}
        >
          {item.available ? "Set Unavailable" : "Set Available"}
        </Button>

        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(item.id)}
        >
          <Trash size={16} />
        </Button>
      </div>
    </div>
  );
}
