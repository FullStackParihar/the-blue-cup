import mongoose, { Schema, Document } from "mongoose";

export interface InventoryTransactionDoc extends Document {
  inventoryItem: mongoose.Types.ObjectId;
  type: "restock" | "consume" | "spoilage" | "adjustment";
  quantity: number;
  note?: string;
  performedBy: string;
  createdAt: Date;
}

const InventoryTransactionSchema = new Schema<InventoryTransactionDoc>(
  {
    inventoryItem: {
      type: Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: [true, "Inventory item reference is required"],
    },
    type: {
      type: String,
      required: [true, "Transaction type is required"],
      enum: ["restock", "consume", "spoilage", "adjustment"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity change is required"],
    },
    note: {
      type: String,
      trim: true,
    },
    performedBy: {
      type: String,
      default: "Admin",
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export default mongoose.model<InventoryTransactionDoc>("InventoryTransaction", InventoryTransactionSchema);
