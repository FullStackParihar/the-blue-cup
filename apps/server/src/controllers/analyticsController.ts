import { Request, Response } from "express";
import Order from "../models/Order";
import dayjs from "dayjs";
import type { ApiResponse } from "@the-blue-cup/types";

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgTicket: number;
  };
  trend: Array<{
    _id: string;
    revenue: number;
    orders: number;
  }>;
  topItems: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  categories: Array<{
    _id: string;
    count: number;
    revenue: number;
  }>;
}

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const { period = "weekly" } = req.query; // weekly, monthly

    const now = dayjs();
    let startDate: dayjs.Dayjs;
    
    if (period === "all") {
      startDate = dayjs(0); // Epoch start
    } else if (period === "monthly") {
      startDate = now.subtract(30, "days").startOf("day");
    } else {
      startDate = now.subtract(7, "days").startOf("day");
    }

    // Use .find() instead of .aggregate() for maximum reliability
    const orders = await Order.find({ 
      status: { $regex: /completed/i },
      createdAt: { $gte: startDate.toDate() }
    }).populate("items.menuItem");

    // Manual Summary
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Manual Trend
    const trendMap = new Map<string, { revenue: number, orders: number }>();
    orders.forEach(o => {
      const date = dayjs(o.createdAt).format("YYYY-MM-DD");
      const current = trendMap.get(date) || { revenue: 0, orders: 0 };
      trendMap.set(date, {
        revenue: current.revenue + (o.totalAmount || 0),
        orders: current.orders + 1
      });
    });
    const trend = Array.from(trendMap.entries())
      .map(([_id, data]) => ({ _id, ...data }))
      .sort((a, b) => a._id.localeCompare(b._id));

    // Manual Top Items
    const itemMap = new Map<string, { name: string, count: number, revenue: number }>();
    orders.forEach(o => {
      o.items.forEach(item => {
        const menuItem = item.menuItem as any;
        if (!menuItem) return;
        const id = menuItem._id.toString();
        const current = itemMap.get(id) || { name: menuItem.name, count: 0, revenue: 0 };
        const price = item.priceAtOrder || menuItem.price || 0;
        itemMap.set(id, {
          name: current.name,
          count: current.count + item.quantity,
          revenue: current.revenue + (item.quantity * price)
        });
      });
    });
    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Manual Categories
    const catMap = new Map<string, { count: number, revenue: number }>();
    orders.forEach(o => {
      o.items.forEach(item => {
        const menuItem = item.menuItem as any;
        if (!menuItem) return;
        const cat = menuItem.category || "Other";
        const current = catMap.get(cat) || { count: 0, revenue: 0 };
        const price = item.priceAtOrder || menuItem.price || 0;
        catMap.set(cat, {
          count: current.count + item.quantity,
          revenue: current.revenue + (item.quantity * price)
        });
      });
    });
    const categories = Array.from(catMap.entries())
      .map(([_id, data]) => ({ _id, ...data }));

    const response: ApiResponse<AnalyticsData> = {
      success: true,
      data: {
        summary: { totalRevenue, totalOrders, avgTicket },
        trend,
        topItems,
        categories
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch analytics", error: String(error) });
  }
};
