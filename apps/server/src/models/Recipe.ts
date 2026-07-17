import mongoose, { Schema, Document } from "mongoose";

export interface RecipeDoc extends Document {
  menuItem: mongoose.Types.ObjectId;
  ingredients: Array<{
    inventoryItem: mongoose.Types.ObjectId;
    quantity: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const RecipeSchema = new Schema<RecipeDoc>(
  {
    menuItem: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: [true, "Menu item reference is required"],
      unique: true,
    },
    ingredients: [
      {
        inventoryItem: {
          type: Schema.Types.ObjectId,
          ref: "InventoryItem",
          required: [true, "Ingredient reference is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Ingredient quantity is required"],
          min: [0, "Quantity cannot be negative"],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<RecipeDoc>("Recipe", RecipeSchema);
