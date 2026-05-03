// ==========================================
// Order Types
// ==========================================

export interface OrderItem {
  menuItem: string;
  quantity: number;
  customization?: string;
  priceAtOrder: number;
}

export interface CreateOrderItem {
  menuItem: string;
  quantity: number;
  customization?: string;
}

export type OrderStatus =
  | "Pending"
  | "Preparing"
  | "Ready"
  | "Completed"
  | "Cancelled";

export const ORDER_STATUSES: OrderStatus[] = [
  "Pending",
  "Preparing",
  "Ready",
  "Completed",
  "Cancelled",
];

export interface Order {
  _id?: string;
  tableNumber: number | null;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  status: OrderStatus;
  customerName?: string;
  customerPhone?: string;
  specialInstructions?: string;
  paymentStatus?: "Pending" | "Paid" | "Failed";
  deviceId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateOrderPayload {
  tableNumber: number | null;
  items: CreateOrderItem[];
  customerName?: string;
  customerPhone?: string;
  specialInstructions?: string;
  deviceId?: string;
}

export interface UpdateOrderStatusPayload {
  orderId: string;
  status: OrderStatus;
}
