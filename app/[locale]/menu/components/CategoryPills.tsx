"use client";

import { Button } from "@/components/ui/button";

export default function CategoryPills({
  categories,
  active,
  onChange,
}: {
  categories: { id: string; label: string }[];
  active?: string;
  onChange?: (id: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {categories.map((c) => {
        const isActive = c.id === active;
        return (
          <Button
            key={c.id}
            onClick={() => onChange?.(c.id)}
            className={`px-4 py-2 rounded-full text-sm ${
              isActive
                ? "bg-orange-600 text-white"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {c.label}
          </Button>
        );
      })}
    </div>
  );
}
