export type MenuCategory = "Starters" | "Mains" | "Drinks" | "Desserts";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  /**
   * Optional per-locale overrides for customer menu.
   * Keys should be locale codes like "fr", "es".
   */
  nameTranslations?: Record<string, string>;
  descriptionTranslations?: Record<string, string>;
  price: number;
  category: MenuCategory;
  images: string[];
  available: boolean;
  tags: {
    spicy: boolean;
    vegetarian: boolean;
    glutenFree: boolean;
  };
  variants: { label: string; price: number }[];
}
