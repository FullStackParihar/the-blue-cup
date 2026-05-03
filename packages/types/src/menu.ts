// ==========================================
// Menu Item Types
// ==========================================

export interface MenuItem {
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  image?: string;
  isAvailable: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MenuCategory =
  | "Coffee"
  | "Tea"
  | "Pastry"
  | "Sandwich"
  | "Beverage"
  | "Dessert";

export const MENU_CATEGORIES: MenuCategory[] = [
  "Coffee",
  "Tea",
  "Pastry",
  "Sandwich",
  "Beverage",
  "Dessert",
];
