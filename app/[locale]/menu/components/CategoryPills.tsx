"use client";

import { Button } from "@/components/ui/button";

function emojiForCategory(label: string) {
  const s = label.toLowerCase();
  if (/(drink|beverage|juice|soda|soft|cocktail|mocktail|wine|beer|coffee|tea)/.test(s))
    return "🥤";
  if (/(dessert|sweet|cake|ice cream|pastry|pudding|chocolate)/.test(s)) return "🍰";
  if (/(breakfast|brunch)/.test(s)) return "🍳";
  if (/(pizza)/.test(s)) return "🍕";
  if (/(burger)/.test(s)) return "🍔";
  if (/(salad)/.test(s)) return "🥗";
  if (/(pasta|noodle)/.test(s)) return "🍝";
  if (/(seafood|fish|shrimp|prawn)/.test(s)) return "🦐";
  if (/(chicken)/.test(s)) return "🍗";
  if (/(sushi)/.test(s)) return "🍣";
  if (/(snack|fries|chips)/.test(s)) return "🍟";
  return "🍽️";
}

export default function CategoryPills({
  categories,
  active,
  onChange,
  showAll = true,
  allLabel = "All categories",
}: {
  categories: { id: string; label: string }[];
  active?: string;
  onChange?: (id: string) => void;
  showAll?: boolean;
  allLabel?: string;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
      {showAll && (
        <Button
          type="button"
          onClick={() => onChange?.("")}
          variant={!active ? "default" : "secondary"}
          className={
            !active
              ? "rounded-full bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90"
              : "rounded-full"
          }
        >
          ✨ {allLabel}
        </Button>
      )}
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
            {emojiForCategory(c.label)} {c.label}
          </Button>
        );
      })}
    </div>
  );
}
