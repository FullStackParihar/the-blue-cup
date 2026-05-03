import { Router, Request, Response } from "express";

const router = Router();

// ==========================================
// Health Check Route
// ==========================================
router.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "☕ The Blue Cup API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

export default router;
