export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface ActivityItem {
  id: string;
  table: number;
  time: string; // “12:45 PM”
  items: OrderItem[];
}
