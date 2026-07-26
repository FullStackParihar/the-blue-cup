import { Router } from "express";
import {
  getAllMenuItems,
  getMenuItem,
  getMenuItemsByCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  renameMenuCategory,
  deleteMenuCategory,
} from "../controllers/menuController";
import { protect, adminOnly } from "../middleware/authMiddleware";
import { upload } from "../services/cloudinaryService";

const router = Router();

router.get("/", getAllMenuItems);
router.get("/category/:category", getMenuItemsByCategory);
router.put("/category/rename", protect, adminOnly, renameMenuCategory);
router.post("/category/delete", protect, adminOnly, deleteMenuCategory);
router.get("/:id", getMenuItem);
router.post("/", protect, adminOnly, createMenuItem);
router.post("/upload", protect, adminOnly, upload.single("image"), (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  res.json({ imageUrl: (req.file as any).path });
});
router.put("/:id", protect, adminOnly, updateMenuItem);
router.delete("/:id", protect, adminOnly, deleteMenuItem);

export default router;
