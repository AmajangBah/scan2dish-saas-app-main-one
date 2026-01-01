"use client";

import { MenuItem } from "../types";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/currency";

interface MenuListItemProps {
  item: MenuItem;
  currency: string;
  onEdit: (item: MenuItem) => void;
  onToggleAvailability: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function MenuListItem({
  item,
  currency,
  onEdit,
  onToggleAvailability,
  onDelete,
}: MenuListItemProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-2xl bg-card shadow-sm">
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{item.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {item.description || "No description yet."}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-semibold tabular-nums">
              {formatPrice(item.price, currency)}
            </div>
            <Badge variant="outline" className="mt-1">
              {item.category}
            </Badge>
          </div>
        </div>

        <div className="mt-2">
          <Badge variant={item.available ? "secondary" : "outline"}>
            {item.available ? (
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Visible
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <EyeOff className="h-3 w-3" />
                Hidden
              </span>
            )}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:justify-end">
        <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
          <Pencil className="h-4 w-4 mr-2" /> Edit
        </Button>

        <Button size="sm" variant="outline" onClick={() => onToggleAvailability(item.id)}>
          {item.available ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" /> Hide
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" /> Show
            </>
          )}
        </Button>

        <Button size="sm" variant="destructive" onClick={() => onDelete(item.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
