export type OrderStatus = "pending" | "preparing" | "completed" | "cancelled";

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
  createdAt: string;
  items: OrderItem[];
}
