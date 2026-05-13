import mongoose, { Schema, Document } from "mongoose";
import type { MenuCategory } from "@the-blue-cup/types";

// ==========================================
// MenuItem Document Interface
// ==========================================
export interface MenuItemDoc extends Document {
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  image?: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// MenuItem Schema
// ==========================================
const MenuItemSchema = new Schema<MenuItemDoc>(
  {
    name: {
      type: String,
      required: [true, "Menu item name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      default: "Delicious artisan creation from The Blue Cup.",
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Tea",
        "Coffee",
        "Ice Tea",
        "Mocktails",
        "Shakes",
        "Breads",
        "Burger",
        "Pav & Fries",
        "Sandwich",
        "Pasta",
        "Pizza",
        "Cafe Special",
        "Momo",
        "Maggi",
        "Rolls",
        "Dessert",
        "Pastry",
        "Beverage",
        "Frappes",
        "Hot Chocolate",
        "OTC",
      ],
    },
    image: {
      type: String,
      default: "",
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient queries
MenuItemSchema.index({ category: 1, isAvailable: 1 });

export default mongoose.model<MenuItemDoc>("MenuItem", MenuItemSchema);
