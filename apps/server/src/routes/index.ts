import { Router } from "express";
import healthRoutes from "./health";
import menuRoutes from "./menu";
import orderRoutes from "./orders";
import authRoutes from "./auth";
import analyticsRoutes from "./analytics";
import inventoryRoutes from "./inventory";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/menu", menuRoutes);
router.use("/orders", orderRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/inventory", inventoryRoutes);

export default router;
