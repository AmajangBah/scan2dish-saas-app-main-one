export type MenuCategory = "Starters" | "Mains" | "Drinks" | "Desserts";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
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
