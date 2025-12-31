"use client";

import { MenuItem } from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/currency";
import { EyeOff, Eye, Pencil, Trash2, Leaf, Flame, WheatOff, ImageIcon } from "lucide-react";

interface MenuCardProps {
  item: MenuItem;
  currency: string;
  onEdit: (item: MenuItem) => void;
  onToggleAvailability: (id: string) => void;
  onDelete: (id: string) => void;
  viewMode?: "grid" | "list";
}

export default function MenuCard({
  item,
  currency,
  onEdit,
  onToggleAvailability,
  onDelete,
  viewMode = "grid",
}: MenuCardProps) {
  return (
    <div
      className={`bg-card rounded-2xl border shadow-sm p-4 transition-colors ${
        viewMode === "list"
          ? "flex items-center gap-4"
          : "hover:bg-muted/30"
      }`}
    >
      <div
        className={`${
          viewMode === "list" ? "w-24 h-24" : "w-full h-36"
        } rounded-xl overflow-hidden border bg-muted flex items-center justify-center shrink-0`}
      >
        {item.images && item.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.images[0]}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-semibold text-lg leading-tight truncate">{item.name}</h2>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {item.description || "No description yet."}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-semibold tabular-nums">
              {formatPrice(item.price, currency)}
            </div>
            <Badge variant={item.available ? "secondary" : "outline"} className="mt-1">
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

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline">{item.category}</Badge>
          {item.tags?.spicy && (
            <Badge variant="secondary" className="gap-1">
              <Flame className="h-3 w-3" /> Spicy
            </Badge>
          )}
          {item.tags?.vegetarian && (
            <Badge variant="secondary" className="gap-1">
              <Leaf className="h-3 w-3" /> Veg
            </Badge>
          )}
          {item.tags?.glutenFree && (
            <Badge variant="secondary" className="gap-1">
              <WheatOff className="h-3 w-3" /> Gluten‑free
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button size="sm" variant="outline" onClick={() => onToggleAvailability(item.id)}>
          {item.available ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Hide
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Show
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
