import { create } from "zustand";
import { persist } from "zustand/middleware";

// ==========================================
// Cart Item Interface
// ==========================================
export interface CartItem {
  _id: string;
  cartItemId?: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  customization?: string;
}

// ==========================================
// Cart Store Interface
// ==========================================
interface CartStore {
  items: CartItem[];
  tableNumber: number | null;
  customerName: string;
  customerPhone: string;
  specialInstructions: string;
  deviceId: string | null;

  // Actions
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateCustomization: (id: string, customization: string) => void;
  setTableNumber: (tableNumber: number | null) => void;
  setCustomerInfo: (name: string, phone: string) => void;
  setCustomerName: (name: string) => void;
  setSpecialInstructions: (instructions: string) => void;
  setDeviceId: (id: string) => void;
  clearCart: () => void;

  // Computed
  getTotalAmount: () => number;
  getTotalItems: () => number;
}

// ==========================================
// Cart Store Implementation
// ==========================================
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      tableNumber: null,
      customerName: "",
      customerPhone: "",
      specialInstructions: "",
      deviceId: null,

      addItem: (item) => {
        const qty = item.quantity ?? 1;
        set((state) => {
          const existingItem = state.items.find(
            (i) => i._id === item._id && i.customization === item.customization
          );
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i._id === item._id && i.customization === item.customization
                  ? { ...i, quantity: i.quantity + qty }
                  : i,
              ),
            };
          }
          const cartItemId = item._id + (item.customization ? `-${item.customization}` : "");
          return {
            items: [...state.items, { ...item, quantity: qty, cartItemId }],
          };
        });
      },

      removeItem: (idOrCartItemId) => {
        set((state) => ({
          items: state.items.filter((i) => (i.cartItemId || i._id) !== idOrCartItemId),
        }));
      },

      updateQuantity: (idOrCartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(idOrCartItemId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => ((i.cartItemId || i._id) === idOrCartItemId ? { ...i, quantity } : i)),
        }));
      },

      updateCustomization: (idOrCartItemId, customization) => {
        set((state) => ({
          items: state.items.map((i) => ((i.cartItemId || i._id) === idOrCartItemId ? { ...i, customization } : i)),
        }));
      },

      setTableNumber: (tableNumber) => set({ tableNumber }),
      setCustomerInfo: (name, phone) => set({ customerName: name, customerPhone: phone }),
      setCustomerName: (customerName) => set({ customerName }),
      setSpecialInstructions: (specialInstructions) => set({ specialInstructions }),
      setDeviceId: (deviceId) => set({ deviceId }),

      clearCart: () =>
        set({
          items: [],
          specialInstructions: "",
        }),

      getTotalAmount: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: "blue-cup-cart",
    },
  ),
);
