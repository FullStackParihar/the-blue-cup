import { Router } from "express";
import {
  getAllOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController";
import { protect, adminOnly, optionalProtect } from "../middleware/authMiddleware";

const router = Router();

router.get("/", optionalProtect, getAllOrders);
router.get("/:id", getOrder);
router.post("/", createOrder);
router.patch("/:id/status", protect, updateOrderStatus);
router.delete("/:id", protect, adminOnly, deleteOrder);

export default router;
