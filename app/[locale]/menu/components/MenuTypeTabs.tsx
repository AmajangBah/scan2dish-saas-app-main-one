"use client";

import { Button } from "@/components/ui/button";

export type MenuType = "all" | "food" | "dessert" | "drink";

const TABS: { id: MenuType; label: string }[] = [
  { id: "all", label: "✨ All" },
  { id: "food", label: "🍽️ Food" },
  { id: "dessert", label: "🍰 Desserts" },
  { id: "drink", label: "🥤 Drinks" },
];

export default function MenuTypeTabs({
  value,
  onChange,
}: {
  value: MenuType;
  onChange: (next: MenuType) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
      {TABS.map((t) => {
        const isActive = t.id === value;
        return (
          <Button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            variant={isActive ? "default" : "secondary"}
            className={
              isActive
                ? "rounded-full bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90"
                : "rounded-full"
            }
          >
            {t.label}
          </Button>
        );
      })}
    </div>
  );
}

