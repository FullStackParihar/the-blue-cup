import mongoose, { Schema, Document } from "mongoose";

export interface InventoryItemDoc extends Document {
  name: string;
  category: string;
  currentStock: number;
  minStockAlert: number;
  unit: string;
  costPrice: number;
  supplier?: string;
  lastRestocked?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema = new Schema<InventoryItemDoc>(
  {
    name: {
      type: String,
      required: [true, "Inventory item name is required"],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    currentStock: {
      type: Number,
      required: [true, "Current stock is required"],
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    minStockAlert: {
      type: Number,
      required: [true, "Min stock alert is required"],
      default: 10,
      min: [0, "Alert level cannot be negative"],
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
      trim: true,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, "Cost price cannot be negative"],
    },
    supplier: {
      type: String,
      trim: true,
    },
    lastRestocked: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<InventoryItemDoc>("InventoryItem", InventoryItemSchema);
