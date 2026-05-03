import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "blue-cup-super-secret";

export const protect = (req: Request, res: Response, next: NextFunction): void => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      (req as any).user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ success: false, error: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ success: false, error: "Not authorized, no token" });
  }
};

export const adminOnly = (req: Request, res: Response, next: NextFunction): void => {
  if ((req as any).user && (req as any).user.role === "admin") {
    next();
  } else {
    res.status(403).json({ success: false, error: "Not authorized as an admin" });
  }
};

export const optionalProtect = (req: Request, res: Response, next: NextFunction): void => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      (req as any).user = decoded;
    } catch (error) {
      // Capture error but don't block (optional)
      (req as any).authError = error instanceof Error ? error.message : "Invalid token";
    }
  }
  next();
};
