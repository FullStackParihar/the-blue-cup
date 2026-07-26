import { Router } from "express";
import {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustStock,
  getTransactions,
  getRecipes,
  updateRecipe,
  renameCategory,
  deleteCategory
} from "../controllers/inventoryController";
import { protect, adminOnly } from "../middleware/authMiddleware";

const router = Router();

// Apply auth middleware globally to all inventory endpoints
router.use(protect);
router.use(adminOnly);

// Category Management
router.put("/category/rename", renameCategory);
router.post("/category/delete", deleteCategory);

// Inventory CRUD & Stock adjustment
router.get("/", getInventory);
router.post("/", createInventoryItem);
router.put("/:id", updateInventoryItem);
router.delete("/:id", deleteInventoryItem);
router.post("/:id/adjust", adjustStock);
router.get("/transactions", getTransactions);

// Recipes mapping
router.get("/recipes", getRecipes);
router.post("/recipes", updateRecipe);

export default router;
