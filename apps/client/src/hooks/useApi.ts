import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuApi, orderApi, analyticsApi } from "../lib/api";
import type { CreateOrderPayload, MenuItem } from "@the-blue-cup/types";

// ==========================================
// Menu Hooks
// ==========================================
export const useMenuItems = () => {
  return useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const res = await menuApi.getAll();
      return res.data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useMenuItemsByCategory = (category: string) => {
  return useQuery({
    queryKey: ["menu", "category", category],
    queryFn: async () => {
      const res = await menuApi.getByCategory(category);
      return res.data ?? [];
    },
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<MenuItem, "_id">) => menuApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MenuItem> }) =>
      menuApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
  });
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => menuApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
  });
};

// ==========================================
// Order Hooks
// ==========================================
export const useOrders = (status?: string, deviceId?: string, timeframe?: string) => {
  return useQuery({
    queryKey: ["orders", status, deviceId, timeframe],
    queryFn: async () => {
      const res = await orderApi.getAll(status, deviceId, timeframe);
      return res.data ?? [];
    },
    enabled: deviceId === undefined || !!deviceId, // Only disable if deviceId is explicitly passed but falsy
    refetchInterval: 10000, // Poll every 10 seconds as fallback
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      const res = await orderApi.getById(id);
      return res.data;
    },
    enabled: !!id,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => orderApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      orderApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

// ==========================================
// Analytics Hooks
// ==========================================
export const useAnalytics = (period: string = "weekly") => {
  return useQuery({
    queryKey: ["analytics", period],
    queryFn: async () => {
      const res = await analyticsApi.get(period);
      return res.data;
    },
  });
};
