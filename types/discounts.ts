// types/discounts.ts
export type DiscountType = 'percentage' | 'fixed' | 'category' | 'item' | 'time';
export type ApplyTo = 'all' | 'category' | 'item';

export interface Discount {
  id: string;
  restaurant_id: string;
  discount_type: DiscountType;
  discount_value: number; // percentage or fixed amount
  apply_to: ApplyTo;
  category_id?: string | null;
  item_id?: string | null;
  start_time?: string | null; // timestamptz
  end_time?: string | null;
  is_active: boolean;
  created_at?: string;
}
