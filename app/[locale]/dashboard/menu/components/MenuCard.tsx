"use client";

import { MenuItem } from "../types";
import { Button } from "@/components/ui/button";

interface MenuCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onToggleAvailability: (id: string) => void;
  onDelete: (id: string) => void;
  viewMode?: "grid" | "list";
}

export default function MenuCard({
  item,
  onEdit,
  onToggleAvailability,
  onDelete,
  viewMode = "grid",
}: MenuCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-md p-4 transition-all ${
        viewMode === "list"
          ? "flex items-center gap-4"
          : "cursor-pointer hover:shadow-lg"
      }`}
    >
      {item.images && item.images[0] && (
        <img
          src={item.images[0]}
          alt={item.name}
          className={`${
            viewMode === "list"
              ? "w-24 h-24 object-cover rounded-md"
              : "w-full h-32 object-cover rounded-md mb-2"
          }`}
        />
      )}

      <div className="flex-1">
        <h2 className="font-bold text-lg">{item.name}</h2>
        <p className="text-gray-600">{item.description}</p>
        <p className="mt-1 font-semibold">${item.price.toFixed(2)}</p>
        <p className="mt-1">
          {item.available ? "Available ✅" : "Not Available ❌"}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onToggleAvailability(item.id)}
        >
          {item.available ? "Set Unavailable" : "Set Available"}
        </Button>
        <Button size="sm" onClick={() => onEdit(item)}>
          Edit
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(item.id)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
