export type OrderStatus = "pending" | "preparing" | "completed";

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  table: string;
  status: OrderStatus;
  total: string;
  time: string;
  items: OrderItem[];
}
