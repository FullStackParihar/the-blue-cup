import { io, Socket } from "socket.io-client";

// ==========================================
// Socket.io Client Instance
// ==========================================
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "";

// Retrieve a persistent device ID for customer tracking
export const getDeviceId = (): string => {
  return localStorage.getItem("bluecup_device_id") || "guest";
};

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  query: { deviceId: getDeviceId() },
});

// ==========================================
// Socket Connection Helpers
// ==========================================
export const connectSocket = (): void => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = (): void => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const joinAdminRoom = (): void => {
  socket.emit("joinAdminRoom");
};

export const joinOrderRoom = (orderId: string): void => {
  socket.emit("joinOrderRoom", orderId);
};

export const leaveOrderRoom = (orderId: string): void => {
  socket.emit("leaveOrderRoom", orderId);
};

export const callWaiter = (tableNumber: number): void => {
  socket.emit("callWaiter", tableNumber);
};
