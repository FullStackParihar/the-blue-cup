import { Router } from "express";
import {
  getAllMenuItems,
  getMenuItem,
  getMenuItemsByCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menuController";
import { protect, adminOnly } from "../middleware/authMiddleware";

const router = Router();

router.get("/", getAllMenuItems);
router.get("/category/:category", getMenuItemsByCategory);
router.get("/:id", getMenuItem);
router.post("/", protect, adminOnly, createMenuItem);
router.put("/:id", protect, adminOnly, updateMenuItem);
router.delete("/:id", protect, adminOnly, deleteMenuItem);

export default router;
