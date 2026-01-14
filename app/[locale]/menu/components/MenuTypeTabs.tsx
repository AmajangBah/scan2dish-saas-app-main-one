"use client";

import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import type { Locale } from "@/i18n";

export type { MenuType } from "../utils/menuType";
import type { MenuType } from "../utils/menuType";

const translations: Record<Locale, Record<string, string>> = {
  en: {
    all: "✨ All",
    food: "🍽️ Food",
    dessert: "🍰 Desserts",
    drink: "🥤 Drinks",
  },
  fr: {
    all: "✨ Tout",
    food: "🍽️ Plats",
    dessert: "🍰 Desserts",
    drink: "🥤 Boissons",
  },
  es: {
    all: "✨ Todo",
    food: "🍽️ Platos",
    dessert: "🍰 Postres",
    drink: "🥤 Bebidas",
  },
};

export default function MenuTypeTabs({
  value,
  onChange,
}: {
  value: MenuType;
  onChange: (next: MenuType) => void;
}) {
  const params = useParams();
  const locale = (
    typeof params.locale === "string" ? params.locale : "en"
  ) as Locale;

  const TABS: { id: MenuType; label: string }[] = [
    { id: "all", label: translations[locale]["all"] || "✨ All" },
    { id: "food", label: translations[locale]["food"] || "🍽️ Food" },
    { id: "dessert", label: translations[locale]["dessert"] || "🍰 Desserts" },
    { id: "drink", label: translations[locale]["drink"] || "🥤 Drinks" },
  ];

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
