import mongoose, { Schema, Document } from "mongoose";
import type { OrderStatus } from "@the-blue-cup/types";

// ==========================================
// Order Sub-Document Interface
// ==========================================
interface OrderItemDoc {
  menuItem: mongoose.Types.ObjectId;
  quantity: number;
  customization?: string;
  priceAtOrder: number;
}

// ==========================================
// Order Document Interface
// ==========================================
export interface OrderDoc extends Document {
  tableNumber: number | null;
  items: OrderItemDoc[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  status: OrderStatus;
  customerName?: string;
  customerPhone?: string;
  specialInstructions?: string;
  paymentStatus?: "Pending" | "Paid" | "Failed";
  deviceId?: string;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Order Schema
// ==========================================
const OrderSchema = new Schema<OrderDoc>(
  {
    tableNumber: {
      type: Number,
      default: null,
      min: [1, "Table number must be at least 1"],
      max: [50, "Table number cannot exceed 50"],
    },
    items: [
      {
        menuItem: {
          type: Schema.Types.ObjectId,
          ref: "MenuItem",
          required: [true, "Menu item reference is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity must be at least 1"],
        },
        customization: {
          type: String,
          trim: true,
          maxlength: [200, "Customization cannot exceed 200 characters"],
        },
        priceAtOrder: {
          type: Number,
          required: [true, "Price at order is required"],
          min: [0, "Price cannot be negative"],
        },
      },
    ],
    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      min: [0, "Subtotal cannot be negative"],
    },
    tax: {
      type: Number,
      required: [true, "Tax is required"],
      min: [0, "Tax cannot be negative"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    status: {
      type: String,
      enum: ["Pending", "Preparing", "Ready", "Completed", "Cancelled"],
      default: "Pending",
    },
    customerName: {
      type: String,
      trim: true,
      maxlength: [100, "Customer name cannot exceed 100 characters"],
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: [500, "Special instructions cannot exceed 500 characters"],
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    deviceId: {
      type: String,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for common queries
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ tableNumber: 1, status: 1 });
OrderSchema.index({ deviceId: 1, createdAt: -1 });

export default mongoose.model<OrderDoc>("Order", OrderSchema);
