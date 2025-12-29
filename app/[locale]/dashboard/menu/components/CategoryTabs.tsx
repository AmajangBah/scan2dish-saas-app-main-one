"use client";

import { Button } from "@/components/ui/button";

interface CategoryTabsProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategoryTabs({
  categories,
  selected,
  onSelect,
}: CategoryTabsProps) {
  // Add "All" at the start
  const allCategories = ["All", ...categories];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {allCategories.map((cat) => (
        <Button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap
            ${
              selected === cat
                ? "bg-orange-500 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
        >
          {cat}
        </Button>
      ))}
    </div>
  );
}
