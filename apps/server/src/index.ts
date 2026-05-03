import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import connectDB from "./config/db";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

// ==========================================
// Load Environment Variables
// ==========================================
dotenv.config();

// ==========================================
// Initialize Express App
// ==========================================
const app = express();
const httpServer = createServer(app);

// ==========================================
// Socket.io Setup (Typed)
// ==========================================
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  const deviceId = socket.handshake.query.deviceId;
  if (deviceId && typeof deviceId === "string") {
    socket.join(deviceId);
    console.log(`📱 Client joined device room: ${deviceId}`);
  }

  socket.on("joinAdminRoom", () => {
    socket.join("admin-dashboard");
    console.log(`👑 Admin joined dashboard: ${socket.id}`);
  });

  socket.on("join-table", (tableNumber: number) => {
    socket.join(`table-${tableNumber}`);
    console.log(`🪑 Client joined table: ${tableNumber}`);
  });

  socket.on("joinOrderRoom", (orderId: string) => {
    socket.join(`order-${orderId}`);
    console.log(`📦 Client tracking order: ${orderId}`);
  });

  socket.on("leaveOrderRoom", (orderId: string) => {
    socket.leave(`order-${orderId}`);
    console.log(`👋 Client stopped tracking order: ${orderId}`);
  });

  socket.on("callWaiter", (tableNumber: number) => {
    console.log(`🛎️ Waiter called to table ${tableNumber}`);
    io.to("admin-dashboard").emit("waiterCalled", tableNumber);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set("io", io);

// ==========================================
// Middleware
// ==========================================
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==========================================
// Routes
// ==========================================
app.use("/api", routes);

// ==========================================
// Error Handling
// ==========================================
app.use(notFoundHandler);
app.use(errorHandler);

// ==========================================
// Start Server
// ==========================================
const PORT = parseInt(process.env.PORT || "5000", 10);

import { logger } from "./utils/logger";

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start listening
    httpServer.listen(PORT, () => {
      logger.info(`☕ ═══════════════════════════════════════════`);
      logger.info(`☕  The Blue Cup Server`);
      logger.info(`☕  Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`☕  Port: ${PORT}`);
      logger.info(`☕  API: http://localhost:${PORT}/api/health`);
      logger.info(`☕ ═══════════════════════════════════════════`);
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export { io };
