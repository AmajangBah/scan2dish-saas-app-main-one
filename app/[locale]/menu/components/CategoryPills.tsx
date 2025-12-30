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
    <div className="flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
      {categories.map((c) => {
        const isActive = c.id === active;
        return (
          <Button
            key={c.id}
            onClick={() => onChange?.(c.id)}
            variant={isActive ? "default" : "secondary"}
            className={
              isActive
                ? "rounded-full bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90"
                : "rounded-full"
            }
          >
            {c.label}
          </Button>
        );
      })}
    </div>
  );
}
