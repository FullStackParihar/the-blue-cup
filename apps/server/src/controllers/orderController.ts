import { Request, Response } from "express";
import { Order, MenuItem, Recipe, InventoryItem, InventoryTransaction } from "../models";
import type { ApiResponse, Order as OrderType } from "@the-blue-cup/types";
import { Server as SocketIOServer } from "socket.io";
import { whatsappService } from "../services/whatsappService";
import { generateBillPdf } from "../services/pdfService";

// ==========================================
// Get All Orders
// ==========================================
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, deviceId } = req.query;
    const user = (req as any).user;

    // Security: Only admins can see all orders. Guests MUST provide a deviceId.
    if (!user && !deviceId) {
      const authError = (req as any).authError;
      res.status(401).json({
        success: false,
        error: authError ? `Session Expired: ${authError}` : "Authentication required or provide deviceId"
      });
      return;
    }

    // If user is not admin, they can ONLY see their own orders via deviceId
    if (user && user.role !== "admin" && !deviceId) {
      res.status(403).json({ success: false, error: "Access denied. Admin privileges required." });
      return;
    }

    const filter: any = {};
    if (status) filter.status = status;

    const { timeframe = "today" } = req.query;

    if (!deviceId) {
      if (timeframe === "today") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        filter.createdAt = { $gte: start };
      } else if (timeframe === "monthly") {
        const start = new Date();
        start.setDate(1); // Start of month
        start.setHours(0, 0, 0, 0);
        filter.createdAt = { $gte: start };
      }
      // timeframe === "all" -> no createdAt filter
    }

    // Validate deviceId format if provided
    if (deviceId) {
      if (typeof deviceId !== "string" || !deviceId.startsWith("dev_")) {
        res.status(400).json({ success: false, error: "Invalid device ID format" });
        return;
      }
      filter.deviceId = deviceId;
    }

    const orders = await Order.find(filter)
      .populate("items.menuItem", "name price category image")
      .sort({ updatedAt: -1 })
      .limit(deviceId ? 20 : 100); // Limit customer history to 20, admin to 100

    const response: ApiResponse<OrderType[]> = {
      success: true,
      data: orders as unknown as OrderType[],
    };
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    res.status(500).json({ success: false, error: message });
  }
};

// ==========================================
// Get Single Order
// ==========================================
export const getOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "items.menuItem",
      "name price category image",
    );
    if (!order) {
      res.status(404).json({ success: false, error: "Order not found" });
      return;
    }
    const response: ApiResponse<OrderType> = {
      success: true,
      data: order as unknown as OrderType,
    };
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch order";
    res.status(500).json({ success: false, error: message });
  }
};

import { z } from "zod";

const createOrderSchema = z.object({
  tableNumber: z.number().int().positive().max(50).nullable(),
  items: z.array(z.object({
    menuItem: z.string(),
    quantity: z.number().int().positive(),
    customization: z.string().optional()
  })).min(1),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  specialInstructions: z.string().optional(),
  deviceId: z.string().optional(),
});

// ==========================================
// Create Order
// ==========================================
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tableNumber, items, customerName, customerPhone, specialInstructions, deviceId } = createOrderSchema.parse(req.body);
    const userId = (req as any).user?.id;

    // 1. DUPLICATE PREVENTION: Check for identical order within 60 seconds
    if (deviceId) {
      const recentOrder = await Order.findOne({
        deviceId,
        status: "Pending",
        createdAt: { $gte: new Date(Date.now() - 60000) }
      });

      if (recentOrder) {
        res.status(409).json({ success: false, error: "Potential duplicate order. Please wait 60s." });
        return;
      }
    }

    // 2. FETCH PRICES: Always fetch prices from DB to prevent client-side manipulation
    let subtotal = 0;
    const itemsWithPrices = [];
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        res.status(400).json({ success: false, error: `Menu item not found: ${item.menuItem}` });
        return;
      }
      if (!menuItem.isAvailable) {
        res.status(400).json({ success: false, error: `Item "${menuItem.name}" is currently sold out.` });
        return;
      }
      subtotal += menuItem.price * item.quantity;
      itemsWithPrices.push({
        ...item,
        priceAtOrder: menuItem.price
      });
    }

    const tax = 0; // No tax
    const totalAmount = subtotal;

    // 3. CREATE ORDER
    const order = await Order.create({
      tableNumber,
      items: itemsWithPrices,
      subtotal,
      tax,
      totalAmount,
      customerName: customerName || "Guest",
      customerPhone,
      specialInstructions,
      deviceId,
      userId,
      status: "Pending",
    });

    const populatedOrder = await Order.findById(order._id).populate(
      "items.menuItem",
      "name price category image",
    );

    const io: SocketIOServer = req.app.get("io");
    io.to("admin-dashboard").emit("newOrderAlert", populatedOrder);

    res.status(201).json({
      success: true,
      data: populatedOrder as unknown as OrderType,
      message: "Order received and processing",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    const message = error instanceof Error ? error.message : "Failed to create order";
    res.status(400).json({ success: false, error: message });
  }
};

// ==========================================
// Update Order Status
// ==========================================
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, tableNumber, items } = req.body;
    const updateData: any = {};

    if (status !== undefined) {
      const validStatuses = ["Pending", "Preparing", "Ready", "Completed", "Cancelled"];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ success: false, error: "Invalid order status" });
        return;
      }
      updateData.status = status;
    }

    if (tableNumber !== undefined) {
      if (tableNumber !== null && (typeof tableNumber !== "number" || tableNumber <= 0 || tableNumber > 50)) {
        res.status(400).json({ success: false, error: "Invalid table number" });
        return;
      }
      updateData.tableNumber = tableNumber;
    }

    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, error: "Order must contain at least one item" });
        return;
      }

      let subtotal = 0;
      const itemsWithPrices = [];
      for (const item of items) {
        const menuItemDoc = await MenuItem.findById(item.menuItem);
        if (!menuItemDoc) {
          res.status(400).json({ success: false, error: `Menu item not found: ${item.menuItem}` });
          return;
        }
        subtotal += menuItemDoc.price * item.quantity;
        itemsWithPrices.push({
          menuItem: menuItemDoc._id,
          quantity: item.quantity,
          customization: item.customization || "",
          priceAtOrder: menuItemDoc.price
        });
      }

      updateData.items = itemsWithPrices;
      updateData.subtotal = subtotal;
      updateData.tax = 0;
      updateData.totalAmount = subtotal;
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ success: false, error: "No fields to update" });
      return;
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    ).populate("items.menuItem", "name price category image");

    if (!order) {
      res.status(404).json({ success: false, error: "Order not found" });
      return;
    }

    // Emit real-time status update
    const io: SocketIOServer = req.app.get("io");
    const socketPayload = {
      orderId: order._id,
      status: order.status,
      tableNumber: order.tableNumber,
      items: order.items,
      subtotal: order.subtotal,
      tax: order.tax,
      totalAmount: order.totalAmount,
    };

    io.to("admin-dashboard").emit("orderStatusUpdate", socketPayload);
    io.to(`order-${order._id}`).emit("orderStatusUpdate", socketPayload);

    if (order.deviceId) {
      io.to(order.deviceId).emit("orderStatusUpdate", socketPayload);
      if (status === "Ready" && order.status === "Ready") {
        io.to(order.deviceId).emit("orderReady", order);
      }
    }
    


    // Automated WhatsApp Billing
    if (status === "Completed" && order.customerPhone) {
      (async () => {
        try {
          const pdfBuffer = generateBillPdf(order as any);
          const message = `*The Blue Cup Cafe* ☕\n\nYour order has been completed! Thank you for visiting us. Your digital bill is attached below.\n\nTotal: ₹${order.totalAmount.toFixed(0)}`;
          const fileName = `Bill_ORD_${order._id.toString().slice(-6).toUpperCase()}.pdf`;
          
          await whatsappService.sendMessage(order.customerPhone!, message, pdfBuffer, fileName);
        } catch (err) {
          console.error("Failed to send automated WhatsApp bill:", err);
        }
      })();
    }

    const response: ApiResponse<OrderType> = {
      success: true,
      data: order as unknown as OrderType,
      message: "Order status updated successfully",
    };
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update order status";
    res.status(400).json({ success: false, error: message });
  }
};

// ==========================================
// Delete Order
// ==========================================
export const deleteOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, error: "Order not found" });
      return;
    }
    res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete order";
    res.status(500).json({ success: false, error: message });
  }
};
