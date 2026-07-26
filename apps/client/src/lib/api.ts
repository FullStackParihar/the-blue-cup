import type { ApiResponse, MenuItem, Order, CreateOrderPayload, InventoryItem, InventoryTransaction, Recipe } from "@the-blue-cup/types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

// ==========================================
// Generic Fetch Helper
// ==========================================
async function apiFetch<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const adminToken = localStorage.getItem("admin-token");
  const userToken = localStorage.getItem("token"); 
  const token = adminToken || userToken;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ==========================================
// Menu API
// ==========================================
export const menuApi = {
  getAll: () => apiFetch<MenuItem[]>("/menu"),

  getByCategory: (category: string) => apiFetch<MenuItem[]>(`/menu/category/${category}`),

  getById: (id: string) => apiFetch<MenuItem>(`/menu/${id}`),

  create: (payload: Omit<MenuItem, "_id">) =>
    apiFetch<MenuItem>("/menu", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<MenuItem>) =>
    apiFetch<MenuItem>(`/menu/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/menu/${id}`, {
      method: "DELETE",
    }),

  uploadImage: (formData: FormData) => {
    const adminToken = localStorage.getItem("admin-token");
    const userToken = localStorage.getItem("token"); 
    const token = adminToken || userToken;
    
    return fetch(`${API_BASE}/menu/upload`, {
      method: "POST",
      headers: token ? { "Authorization": `Bearer ${token}` } : {},
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    });
  },

  renameCategory: (oldCategory: string, newCategory: string) =>
    apiFetch<{ success: boolean }>("/menu/category/rename", {
      method: "PUT",
      body: JSON.stringify({ oldCategory, newCategory }),
    }),

  deleteCategory: (category: string) =>
    apiFetch<{ success: boolean }>("/menu/category/delete", {
      method: "POST",
      body: JSON.stringify({ category }),
    }),
};

// ==========================================
// Order API
// ==========================================
export const orderApi = {
  getAll: (status?: string, deviceId?: string, timeframe?: string) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (deviceId) params.append("deviceId", deviceId);
    if (timeframe) params.append("timeframe", timeframe);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<Order[]>(`/orders${query}`);
  },

  getById: (id: string) => apiFetch<Order>(`/orders/${id}`),

  create: (payload: CreateOrderPayload) =>
    apiFetch<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateStatus: (id: string, status?: string, tableNumber?: number | null, items?: any[]) =>
    apiFetch<Order>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, tableNumber, items }),
    }),
};

// ==========================================
// Auth API
// ==========================================
export const authApi = {
  login: (payload: any) =>
    apiFetch<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  register: (payload: any) =>
    apiFetch<any>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getMe: () => apiFetch<any>("/auth/me"),
};

// ==========================================
// Analytics API
// ==========================================
export const analyticsApi = {
  get: (period: string = "weekly") => apiFetch<any>(`/analytics?period=${period}`),
};

// ==========================================
// Inventory API
// ==========================================
export const inventoryApi = {
  getAll: () => apiFetch<InventoryItem[]>("/inventory"),
  create: (payload: Omit<InventoryItem, "_id">) =>
    apiFetch<InventoryItem>("/inventory", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: Partial<InventoryItem>) =>
    apiFetch<InventoryItem>(`/inventory/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/inventory/${id}`, {
      method: "DELETE",
    }),
  adjustStock: (id: string, payload: { type: string; quantity: number; note?: string }) =>
    apiFetch<{ item: InventoryItem; transaction: any }>(`/inventory/${id}/adjust`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  renameCategory: (oldCategory: string, newCategory: string) =>
    apiFetch<{ success: boolean }>("/inventory/category/rename", {
      method: "PUT",
      body: JSON.stringify({ oldCategory, newCategory }),
    }),
  deleteCategory: (category: string) =>
    apiFetch<{ success: boolean }>("/inventory/category/delete", {
      method: "POST",
      body: JSON.stringify({ category }),
    }),
  getTransactions: () => apiFetch<InventoryTransaction[]>("/inventory/transactions"),
  getRecipes: () => apiFetch<Recipe[]>("/inventory/recipes"),
  updateRecipe: (payload: { menuItemId: string; ingredients: { inventoryItem: string; quantity: number }[] }) =>
    apiFetch<Recipe>("/inventory/recipes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
