import { Request, Response } from "express";
import { MenuItem } from "../models";
import type { ApiResponse, MenuItem as MenuItemType } from "@the-blue-cup/types";

// ==========================================
// Get All Menu Items
// ==========================================
export const getAllMenuItems = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await MenuItem.find().sort({ category: 1, name: 1 });
    const response: ApiResponse<MenuItemType[]> = {
      success: true,
      data: items as unknown as MenuItemType[],
    };
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch menu items";
    res.status(500).json({ success: false, error: message });
  }
};

// ==========================================
// Get Menu Items by Category
// ==========================================
export const getMenuItemsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;
    const items = await MenuItem.find({ category, isAvailable: true }).sort({ name: 1 });
    const response: ApiResponse<MenuItemType[]> = {
      success: true,
      data: items as unknown as MenuItemType[],
    };
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch menu items";
    res.status(500).json({ success: false, error: message });
  }
};

// ==========================================
// Get Single Menu Item
// ==========================================
export const getMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      res.status(404).json({ success: false, error: "Menu item not found" });
      return;
    }
    const response: ApiResponse<MenuItemType> = {
      success: true,
      data: item as unknown as MenuItemType,
    };
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch menu item";
    res.status(500).json({ success: false, error: message });
  }
};

import { z } from "zod";

const menuItemSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.string().min(1),
  image: z.string().optional(),
  isAvailable: z.boolean().optional(),
});

// ==========================================
// Create Menu Item
// ==========================================
export const createMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = menuItemSchema.parse(req.body);
    const item = await MenuItem.create(validatedData);
    const response: ApiResponse<MenuItemType> = {
      success: true,
      data: item as unknown as MenuItemType,
      message: "Menu item created successfully",
    };
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    const message = error instanceof Error ? error.message : "Failed to create menu item";
    res.status(400).json({ success: false, error: message });
  }
};

// ==========================================
// Update Menu Item
// ==========================================
export const updateMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = menuItemSchema.partial().parse(req.body);
    const item = await MenuItem.findByIdAndUpdate(req.params.id, validatedData, {
      new: true,
      runValidators: true,
    });
    if (!item) {
      res.status(404).json({ success: false, error: "Menu item not found" });
      return;
    }
    const response: ApiResponse<MenuItemType> = {
      success: true,
      data: item as unknown as MenuItemType,
      message: "Menu item updated successfully",
    };
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    const message = error instanceof Error ? error.message : "Failed to update menu item";
    res.status(400).json({ success: false, error: message });
  }
};

// ==========================================
// Delete Menu Item
// ==========================================
export const deleteMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      res.status(404).json({ success: false, error: "Menu item not found" });
      return;
    }
    res.json({ success: true, message: "Menu item deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete menu item";
    res.status(500).json({ success: false, error: message });
  }
};

// ==========================================
// Category Management
// ==========================================
export const renameMenuCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { oldCategory, newCategory } = req.body;
    if (!oldCategory || !newCategory) {
      res.status(400).json({ success: false, error: "oldCategory and newCategory are required" });
      return;
    }
    await MenuItem.updateMany(
      { category: oldCategory },
      { category: newCategory }
    );
    res.json({ success: true, message: `Menu category renamed from ${oldCategory} to ${newCategory}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to rename menu category";
    res.status(500).json({ success: false, error: message });
  }
};

export const deleteMenuCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.body;
    if (!category) {
      res.status(400).json({ success: false, error: "Category is required" });
      return;
    }
    await MenuItem.deleteMany({ category });
    res.json({ success: true, message: `Menu category ${category} and all its items deleted successfully` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete menu category";
    res.status(500).json({ success: false, error: message });
  }
};
