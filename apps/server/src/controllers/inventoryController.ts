import { Request, Response, NextFunction } from "express";
import { InventoryItem, InventoryTransaction, Recipe } from "../models";
import { ApiResponse } from "@the-blue-cup/types";

// ==========================================
// Inventory Item Endpoints
// ==========================================

export const getInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await InventoryItem.find().sort({ name: 1 });
    const response: ApiResponse<any> = {
      success: true,
      data: items,
      message: "Inventory retrieved successfully",
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const createInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, category, currentStock, minStockAlert, unit, costPrice, supplier } = req.body;

    const item = await InventoryItem.create({
      name,
      category,
      currentStock: currentStock || 0,
      minStockAlert: minStockAlert || 10,
      unit,
      costPrice: costPrice || 0,
      supplier,
      lastRestocked: currentStock > 0 ? new Date() : undefined,
    });

    // If starting with stock, log the transaction
    if (currentStock > 0) {
      await InventoryTransaction.create({
        inventoryItem: item._id,
        type: "restock",
        quantity: currentStock,
        note: "Initial stock load",
        performedBy: "Admin",
      });
    }

    const response: ApiResponse<any> = {
      success: true,
      data: item,
      message: "Inventory item created successfully",
    };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
};

export const updateInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, category, minStockAlert, unit, costPrice, supplier } = req.body;

    const item = await InventoryItem.findByIdAndUpdate(
      id,
      { name, category, minStockAlert, unit, costPrice, supplier },
      { new: true, runValidators: true }
    );

    if (!item) {
      res.status(404).json({ success: false, message: "Inventory item not found" });
      return;
    }

    const response: ApiResponse<any> = {
      success: true,
      data: item,
      message: "Inventory item updated successfully",
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const deleteInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const item = await InventoryItem.findByIdAndDelete(id);
    if (!item) {
      res.status(404).json({ success: false, message: "Inventory item not found" });
      return;
    }

    // Also delete any associated transactions and recipe mappings
    await InventoryTransaction.deleteMany({ inventoryItem: id });
    await Recipe.updateMany(
      {},
      { $pull: { ingredients: { inventoryItem: id } } }
    );

    const response: ApiResponse<any> = {
      success: true,
      message: "Inventory item deleted successfully",
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const adjustStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { type, quantity, note } = req.body; // type: restock, consume, spoilage, adjustment

    if (!quantity || isNaN(Number(quantity))) {
      res.status(400).json({ success: false, message: "Valid quantity change is required" });
      return;
    }

    const item = await InventoryItem.findById(id);
    if (!item) {
      res.status(404).json({ success: false, message: "Inventory item not found" });
      return;
    }

    const qtyChange = Number(quantity);
    item.currentStock = Math.max(0, item.currentStock + qtyChange);
    if (type === "restock" && qtyChange > 0) {
      item.lastRestocked = new Date();
    }
    await item.save();

    const transaction = await InventoryTransaction.create({
      inventoryItem: id,
      type,
      quantity: qtyChange,
      note,
      performedBy: "Admin",
    });

    const response: ApiResponse<any> = {
      success: true,
      data: { item, transaction },
      message: "Stock adjusted successfully",
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transactions = await InventoryTransaction.find()
      .populate("inventoryItem")
      .sort({ createdAt: -1 })
      .limit(100);

    const response: ApiResponse<any> = {
      success: true,
      data: transactions,
      message: "Transactions retrieved successfully",
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

// ==========================================
// Recipe / Ingredient Linkage Endpoints
// ==========================================

export const getRecipes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recipes = await Recipe.find()
      .populate("menuItem")
      .populate("ingredients.inventoryItem");

    const response: ApiResponse<any> = {
      success: true,
      data: recipes,
      message: "Recipes retrieved successfully",
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const updateRecipe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { menuItemId, ingredients } = req.body; // ingredients: Array of { inventoryItem: string, quantity: number }

    if (!menuItemId || !Array.isArray(ingredients)) {
      res.status(400).json({ success: false, message: "menuItemId and ingredients array are required" });
      return;
    }

    let recipe = await Recipe.findOne({ menuItem: menuItemId });

    if (ingredients.length === 0) {
      if (recipe) {
        await Recipe.deleteOne({ _id: recipe._id });
      }
      res.json({ success: true, message: "Recipe cleared for this menu item" });
      return;
    }

    if (recipe) {
      recipe.ingredients = ingredients;
      await recipe.save();
    } else {
      recipe = await Recipe.create({
        menuItem: menuItemId,
        ingredients,
      });
    }

    const populatedRecipe = await Recipe.findById(recipe._id)
      .populate("menuItem")
      .populate("ingredients.inventoryItem");

    const response: ApiResponse<any> = {
      success: true,
      data: populatedRecipe,
      message: "Recipe updated successfully",
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

// ==========================================
// Category Management Endpoints
// ==========================================

export const renameCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { oldCategory, newCategory } = req.body;
    if (!oldCategory || !newCategory) {
      res.status(400).json({ success: false, message: "oldCategory and newCategory are required" });
      return;
    }
    await InventoryItem.updateMany(
      { category: oldCategory },
      { category: newCategory }
    );
    res.json({ success: true, message: `Category renamed from ${oldCategory} to ${newCategory}` });
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.body;
    if (!category) {
      res.status(400).json({ success: false, message: "Category is required" });
      return;
    }
    
    // Find all item IDs in this category to clean up recipes & transactions
    const items = await InventoryItem.find({ category });
    const itemIds = items.map(item => item._id);

    // Delete items
    await InventoryItem.deleteMany({ category });
    
    // Clean up transactions and recipes
    await InventoryTransaction.deleteMany({ inventoryItem: { $in: itemIds } });
    await Recipe.updateMany(
      {},
      { $pull: { ingredients: { inventoryItem: { $in: itemIds } } } }
    );

    res.json({ success: true, message: `Category ${category} and all its items deleted successfully` });
  } catch (err) {
    next(err);
  }
};
