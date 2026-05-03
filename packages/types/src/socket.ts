// ==========================================
// Socket Event Types
// ==========================================

import type { Order } from "./order";

export interface ServerToClientEvents {
  newOrderAlert: (order: Order) => void;
  orderStatusUpdate: (data: { orderId: string; status: string }) => void;
}

export interface ClientToServerEvents {
  joinAdminRoom: () => void;
  joinOrderRoom: (orderId: string) => void;
}
